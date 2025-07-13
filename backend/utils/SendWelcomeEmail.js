// utils/sendWelcomeEmail.js
import { SendMailClient } from "zeptomail";
import redis from "../utils/RedisClient.js"; 
const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_TOKEN_WELCOME; // keep token in .env

let client = new SendMailClient({url, token});

export const sendWelcomeEmail = async (email, name, ipAddress = null) => {
    // Check email frequency to prevent abuse
    const emailKey = `welcome-email-freq:${email}`;
    const lastEmailTime = await redis.get(emailKey);
    
    if (lastEmailTime) {
        const timeDiff = Date.now() - parseInt(lastEmailTime);
        const minInterval = 60 * 60 * 1000; // 1 hour minimum between welcome emails to same address
        
        if (timeDiff < minInterval) {
            console.warn(`[WELCOME EMAIL THROTTLED] Email: ${email}, IP: ${ipAddress}, Last sent: ${Math.ceil((minInterval - timeDiff) / 1000 / 60)}m ago`);
            return; // Silently skip sending duplicate welcome email
        }
    }
    
    try {
        await client.sendMailWithTemplate({
            "mail_template_key": "2518b.6fac2f4cafd5524b.k1.cb5a2a60-283f-11f0-ba67-525400c92439.19697158006",
            "from": 
            {
                "address": "noreply@gogoiarmaantech.me",
                "name": "Sahayog Nepal"
            },
            "to": 
            [
                {
                "email_address": 
                    {
                        "address": `${email}`,
                        "name": `${name}`
                    }
                }
            ],
            "merge_info": {"UserName":`${name}`},
            "subject": "Welcome to Sahayog Nepal"
        });
        
        // Track successful email send
        await redis.set(emailKey, Date.now().toString(), 'EX', 60 * 60); // 1 hour expiry
        
        console.log(`[WELCOME EMAIL SENT] Email: ${email}, Name: ${name}, IP: ${ipAddress}`);
        
    } catch (error) {
        console.error(`[WELCOME EMAIL ERROR] Email: ${email}, IP: ${ipAddress}, Error: ${error.message}`);
        throw error;
    }
};


 