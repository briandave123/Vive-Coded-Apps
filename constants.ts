
import { EmailAccount } from './types';

export const MOCK_ACCOUNTS: EmailAccount[] = [
  { id: 1, client: 'Tyler Trufi', protocol: 'SMTP', email: 'tyler@somethinginclabs.com', error: 'SMTP Error: RTPS-CE- Command failed, Warmup Blocked: Message not delivered Your message couldn' },
  { id: 2, client: 'Tyler Trufi', protocol: 'SMTP', email: 'tyler.trufi@somethinginclabs.com', error: 'SMTP Error: RTPS-CE- Command failed, SMTP Connection Failed' },
  { id: 3, client: 'Tyler Trufi', protocol: 'SMTP', email: 'tyler@somethinginc-team.com', error: 'SMTP Error: RTPS-CE- Command failed, Warmup Blocked: Pesan tidak terkirim Pesan Anda tidak dapat' },
  { id: 4, client: 'John Doe', protocol: 'IMAP', email: 'john.d@example.com', error: '' },
  { id: 5, client: 'Jane Smith', protocol: 'SMTP', email: 'jane.smith@webcorp.com', error: 'Authentication failed. Please check your password.' },
  { id: 6, client: 'Acme Corp', protocol: 'SMTP', email: 'support@acme.com', error: '' },
  { id: 7, client: 'Innovate LLC', protocol: 'IMAP', email: 'contact@innovatellc.dev', error: '' },
  { id: 8, client: 'Tyler Trufi', protocol: 'SMTP', email: 'ttrufi@personal.io', error: 'Connection timed out. Server may be offline.' },
  { id: 9, client: 'Global Tech', protocol: 'SMTP', email: 'info@globaltech.net', error: '' },
  { id: 10, client: 'Peter Jones', protocol: 'SMTP', email: 'peter.j@consulting.com', error: 'SMTP Error: 535-5.7.8 Username and Password not accepted.' },
  { id: 11, client: 'Sarah Connor', protocol: 'IMAP', email: 's.connor@cyberdyne.com', error: '' },
  { id: 12, client: 'Kyle Reese', protocol: 'SMTP', email: 'k.reese@techcom.org', error: '' },
  { id: 13, client: 'Tyler Durden', protocol: 'SMTP', email: 'tyler@paperstsoap.com', error: 'Cannot connect to SMTP server.' },
  { id: 14, client: 'Marla Singer', protocol: 'IMAP', email: 'marla.s@supportgroup.net', error: '' },
  { id: 15, client: 'Robert Paulson', protocol: 'SMTP', email: 'bob.p@projectmayhem.com', error: '' },
  { id: 16, client: 'Big Solutions', protocol: 'SMTP', email: 'help@bigsolutions.com', error: 'Mailbox is full. Please clear space.' },
  { id: 17, client: 'Tiny Startup', protocol: 'SMTP', email: 'founder@tinystartup.io', error: '' },
  { id: 18, client: 'Midsize Co', protocol: 'IMAP', email: 'accounts@midsize.co', error: '' },
  { id: 19, client: 'Enterprise Inc', protocol: 'SMTP', email: 'billing@enterprise.inc', error: 'Recipient address rejected: User unknown in virtual alias table' },
  { id: 20, client: 'Another Client', protocol: 'SMTP', email: 'contact@another.com', error: '' },
];
