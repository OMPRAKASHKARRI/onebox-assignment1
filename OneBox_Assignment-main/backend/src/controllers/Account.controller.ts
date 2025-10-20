import { Request, Response } from 'express';
import { addImapAccount, getConnectedAccounts } from '../imap/iManager';
import { searchEmails, EmailsCountForAccount } from '../services/elastic.service';


// creating controller function to handle adding/syncing accounts operations...

export async function addAccount(req: Request, res: Response){
    console.log("Incoming request body:", req.body);
    const { email, password, host, port, secure } = req.body;
    
    if (!email || !password || !host || !port || secure === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        await addImapAccount({ email, password, host, port, secure });
        res.status(201).json({ message: `Account started syncing ${email}` });
    } catch (error) {
        console.error('Error adding account:', error);
        res.status(500).json({ error: 'Failed to add account' });
    }
}

export async function getAccounts(req: Request, res: Response){
  try {
    const accounts = getConnectedAccounts();
   res.json(accounts);
  } catch (error) {
    console.log('failed to get connected accounts', error);
    res.status(500).json({error: 'Account loading failed'});
  }
}

// taking count of emails in the connected account...
export async function getAllAccounts(req: Request, res: Response){
    const accounts = Object.keys(ConnectedAccount);
    const result = await Promise.all(
        accounts.map(async (email) => {
            const totalEmails = await EmailsCountForAccount(email); // takes count from ES...
            return{
                id: email,
                email,
                provider: 'IMAP',
                status: 'connected',
                lastSync: new Date().toISOString(),
                totalEmails,
            };
            
        })
    );
    res.json(result);
}


// To search emails by categories specific ....

export async function searchEmailsByCategory(req: Request, res: Response) {
    try {
        const category = req.query.category as string || '';
        const account = req.query.account as string || '';
        const folder = req.query.folder as string || '';

        if (!category) {
            return res.status(400).json({ error: 'Category query parameter is required' });
        }

        // Searching emails with category as query...
        
        const results = await searchEmails(category, account, folder);
        res.status(200).json({ emails: results });
    } catch (error) {
        console.error('Error searching emails by category:', error);
        res.status(500).json({ error: 'Failed to search emails' });
    }
}