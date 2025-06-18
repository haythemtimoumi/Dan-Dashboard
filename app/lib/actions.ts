'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { StockForm } from './definitions';

const API_URL = 'https://stocksapidashboard.duckdns.org';

const StockFormSchema = z.object({
  id: z.string().optional(),
  ticker: z.string().min(1, { message: 'Please enter a ticker symbol.' }),
  sentiment_score: z.coerce.number().min(-100).max(100),
  signal_score: z.coerce.number().min(-100).max(100),
  pe: z.coerce.number().min(0),
  buy_price: z.coerce.number().min(0),
  guru: z.string().min(1, { message: 'Please enter a guru name.' }),
  source: z.enum(['Rule 1', 'Magic Formula']),
  highlight: z.boolean().default(false),
});

const CsvFileSchema = z.object({
  csv_file: z.instanceof(File).refine(
    (file) => file.size > 0, 
    { message: 'Please select a CSV file.' }
  ).refine(
    (file) => file.type === 'text/csv' || file.name.endsWith('.csv'),
    { message: 'File must be a CSV.' }
  ),
});

export type State = {
  errors?: {
    ticker?: string[];
    sentiment_score?: string[];
    signal_score?: string[];
    pe?: string[];
    buy_price?: string[];
    guru?: string[];
    source?: string[];
    highlight?: string[];
    csv_file?: string[];
  };
  message?: string | null;
};

export async function createStock(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = StockFormSchema.safeParse({
    ticker: formData.get('ticker'),
    sentiment_score: formData.get('sentiment_score'),
    signal_score: formData.get('signal_score'),
    pe: formData.get('pe'),
    buy_price: formData.get('buy_price'),
    guru: formData.get('guru'),
    source: formData.get('source'),
    highlight: formData.get('highlight') === 'on',
  });

  // If form validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Stock.',
    };
  }

  // Prepare data for API
  const { ticker, sentiment_score, signal_score, pe, buy_price, guru, source, highlight } = validatedFields.data;
  
  try {
    const response = await fetch(`${API_URL}/api/stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker,
        sentiment_score,
        signal_score,
        pe,
        buy_price,
        guru,
        source,
        highlight,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create stock: ${response.statusText}`);
    }
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Stock.',
    };
  }

  revalidatePath('/dashboard/stocks');
  redirect('/dashboard/stocks');
}

export async function updateStock(id: string, prevState: State, formData: FormData) {
  const validatedFields = StockFormSchema.safeParse({
    id,
    ticker: formData.get('ticker'),
    sentiment_score: formData.get('sentiment_score'),
    signal_score: formData.get('signal_score'),
    pe: formData.get('pe'),
    buy_price: formData.get('buy_price'),
    guru: formData.get('guru'),
    source: formData.get('source'),
    highlight: formData.get('highlight') === 'on',
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Stock.',
    };
  }

  const { ticker, sentiment_score, signal_score, pe, buy_price, guru, source, highlight } = validatedFields.data;
  
  try {
    const response = await fetch(`${API_URL}/api/stocks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker,
        sentiment_score,
        signal_score,
        pe,
        buy_price,
        guru,
        source,
        highlight,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update stock: ${response.statusText}`);
    }
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Stock.',
    };
  }

  revalidatePath('/dashboard/stocks');
  redirect('/dashboard/stocks');
}

export async function deleteStock(id: string) {
  try {
    const response = await fetch(`${API_URL}/api/stocks/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete stock: ${response.statusText}`);
    }
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Stock.',
    };
  }

  revalidatePath('/dashboard/stocks');
}

export async function uploadStocksCsv(prevState: State, formData: FormData) {
  // Validate that a file was uploaded
  const validatedFields = CsvFileSchema.safeParse({
    csv_file: formData.get('csv_file'),
  });

  // If form validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid file. Please upload a CSV file.',
    };
  }

  try {
    // Get the file from the form data
    const file = formData.get('csv_file') as File;
    
    // Create a FormData object to send the file to the API
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    
    // Send the file to the API
    const response = await fetch(`${API_URL}/api/stocks/upload-csv`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to upload CSV: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    revalidatePath('/dashboard/stocks');
    return {
      message: `Success! Uploaded ${result.count} stocks from CSV.`,
    };
  } catch (error) {
    console.error('CSV Upload Error:', error);
    return {
      message: `Error: ${error instanceof Error ? error.message : 'Failed to upload CSV file.'}`,
    };
  }
}