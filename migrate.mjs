import pg from 'pg';
import axios from 'axios';

// --- CONFIGURAÇÃO ---
const N8N_DB_CONFIG = {
  user: 'postgres',
  host: '72.60.15.111',
  database: 'n8n',
  password: '6a33f836df89d8fc2d1a',
  port: 5432,
};

const API_URL = 'https://api-clinic-eight.vercel.app/api/admin/migrate';

const N8N_API_KEY = 'd4a7f3c9e28b5176fa8d9c2b34e1f67ab9c08d72f4a3c1e0b6f5987d21c4a5e3';
// --- FIM DA CONFIGURAÇÃO ---

async function runMigration() {
  console.log('Iniciando a migração...');
  const client = new pg.Client(N8N_DB_CONFIG);
  
  try {
    await client.connect();
    console.log('Conectado ao banco de dados do n8n.');

    const res = await client.query('SELECT session_id AS "sessionId", message FROM chat_history');
    console.log(`Encontrados ${res.rowCount} registros no total.`);
    
    let validRecords = 0;
    const migrationData = res.rows.map(row => {
        const messageData = row.message;

        // CORREÇÃO: Verifica se 'message' já é um array, em vez de tentar fazer o parse.
        if (Array.isArray(messageData)) {
            validRecords++;
            return {
                sessionId: row.sessionId,
                message: messageData
            };
        } else {
            // Se não for um array, o registro é inválido ou está em um formato inesperado.
            console.warn(`Registro para sessionId ${row.sessionId} foi ignorado: o formato não é um array.`);
            return null;
        }
    }).filter(Boolean); // Remove os registros nulos (inválidos)

    if (migrationData.length === 0) {
        console.log('Nenhum registro válido encontrado para migrar. Encerrando.');
        return;
    }

    console.log(`Processando ${validRecords} registros válidos.`);
    console.log('Enviando dados para a nova API...');

    const response = await axios.post(API_URL, migrationData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_API_KEY}`,
      },
    });

    console.log('Migração concluída com sucesso!');
    console.log(`- Status: ${response.status}`);
    console.log(`- Registros inseridos: ${response.data.count}`);

  } catch (error) {
    console.error('Ocorreu um erro durante a migração:');
    if (axios.isAxiosError(error)) {
        console.error(`- Status: ${error.response?.status}`);
        console.error(`- Detalhes:`, error.response?.data);
    } else {
        console.error(error);
    }
  } finally {
    await client.end();
    console.log('Desconectado do banco de dados do n8n.');
  }
}

runMigration();