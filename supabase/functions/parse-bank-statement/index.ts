const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  date: string;
  description: string;
  amount: number;
}

function parseCSV(content: string): Transaction[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const transactions: Transaction[] = [];
  const header = lines[0].toLowerCase();
  
  // Try to detect columns
  const headers = header.split(/[,;\t]/);
  let dateIdx = headers.findIndex(h => h.includes('date') || h.includes('data'));
  let descIdx = headers.findIndex(h => h.includes('desc') || h.includes('memo') || h.includes('name') || h.includes('payee'));
  let amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('valor') || h.includes('value'));
  let creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('crédito'));
  let debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('débito'));

  // Fallback to common positions
  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 1;
  if (amountIdx === -1 && creditIdx === -1 && debitIdx === -1) amountIdx = 2;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted values
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const date = values[dateIdx] || '';
    const description = values[descIdx] || '';
    
    let amount = 0;
    if (creditIdx !== -1 && debitIdx !== -1) {
      const credit = parseFloat(values[creditIdx]?.replace(/[^\d.-]/g, '') || '0');
      const debit = parseFloat(values[debitIdx]?.replace(/[^\d.-]/g, '') || '0');
      amount = credit - debit;
    } else {
      amount = parseFloat(values[amountIdx]?.replace(/[^\d.-]/g, '') || '0');
    }

    if (date && !isNaN(amount) && amount !== 0) {
      transactions.push({ date, description, amount });
    }
  }

  return transactions;
}

function parseOFX(content: string): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Simple OFX parser - extract STMTTRN blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];
    
    // Extract fields
    const dtPosted = block.match(/<DTPOSTED>(\d{8})/)?.[1];
    const trnAmt = block.match(/<TRNAMT>([+-]?\d+\.?\d*)/)?.[1];
    const name = block.match(/<NAME>([^<\n]+)/)?.[1]?.trim();
    const memo = block.match(/<MEMO>([^<\n]+)/)?.[1]?.trim();

    if (dtPosted && trnAmt) {
      // Parse date YYYYMMDD to YYYY-MM-DD
      const date = `${dtPosted.slice(0, 4)}-${dtPosted.slice(4, 6)}-${dtPosted.slice(6, 8)}`;
      const amount = parseFloat(trnAmt);
      const description = name || memo || 'Transaction';

      if (!isNaN(amount) && amount !== 0) {
        transactions.push({ date, description, amount });
      }
    }
  }

  // Fallback: try SGML-style OFX (without closing tags)
  if (transactions.length === 0) {
    const lines = content.split('\n');
    let currentTx: Partial<Transaction> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('<DTPOSTED>')) {
        const val = trimmed.replace('<DTPOSTED>', '').slice(0, 8);
        currentTx.date = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
      } else if (trimmed.startsWith('<TRNAMT>')) {
        currentTx.amount = parseFloat(trimmed.replace('<TRNAMT>', ''));
      } else if (trimmed.startsWith('<NAME>')) {
        currentTx.description = trimmed.replace('<NAME>', '').trim();
      } else if (trimmed.startsWith('<MEMO>') && !currentTx.description) {
        currentTx.description = trimmed.replace('<MEMO>', '').trim();
      } else if (trimmed === '</STMTTRN>' || (trimmed.startsWith('<STMTTRN>') && currentTx.date)) {
        if (currentTx.date && currentTx.amount !== undefined && currentTx.amount !== 0) {
          transactions.push({
            date: currentTx.date,
            description: currentTx.description || 'Transaction',
            amount: currentTx.amount,
          });
        }
        currentTx = {};
      }
    }
  }

  return transactions;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, fileType, fileName } = await req.json();
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing ${fileType} file: ${fileName}, content length: ${content.length}`);

    let transactions: Transaction[];
    
    if (fileType === 'ofx') {
      transactions = parseOFX(content);
    } else {
      transactions = parseCSV(content);
    }

    console.log(`Parsed ${transactions.length} transactions`);

    return new Response(
      JSON.stringify({ transactions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error parsing bank statement:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to parse file', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
