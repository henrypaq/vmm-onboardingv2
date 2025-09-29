import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = createClient();
    const { clientId } = await params;

    console.log('[Client Details API] Fetching client details for:', clientId);

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('[Client Details API] Error fetching client:', clientError);
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    console.log('[Client Details API] Client found:', client);

    return NextResponse.json({
      success: true,
      client
    });

  } catch (error) {
    console.error('[Client Details API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
