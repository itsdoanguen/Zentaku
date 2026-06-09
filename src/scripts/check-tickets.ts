import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkTickets() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: Number(process.env.DATABASE_PORT) || 3306,
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM support_tickets');
    console.log('Tickets in DB:', rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

checkTickets();
