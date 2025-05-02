const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xzasgcgqcbjmbgdioonf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YXNnY2dxY2JqbWJnZGlvb25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxNDA2NjMsImV4cCI6MjA2MTcxNjY2M30.cZixRNTtfywxixD6Nvm0Zn8BomfQxyO3nm-QNZ46Q2Q'

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase 