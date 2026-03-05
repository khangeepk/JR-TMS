import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for backend uploads

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase Storage configuration missing in .env")
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null

export async function uploadReport(fileBuffer: Buffer, fileName: string) {
    if (!supabase) {
        throw new Error("Supabase Storage is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.")
    }

    const { data, error } = await supabase.storage
        .from('reports')
        .upload(`monthly/${fileName}`, fileBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            upsert: true
        })

    if (error) {
        console.error("Supabase Upload Error:", error)
        throw new Error(error.message)
    }

    return data
}
