require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Client = require('../models/Client');
const User = require('../models/User');

const seedTruliv = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Check if client exists
        // (Assuming client creation logic remains the same or we just want to update keys if needed)
        // For simplicity, let's just focus on the User part or ensure client exists.

        let client = await Client.findOne({ name: 'Truliv Properties' });
        if (!client) {
            const apiKey = crypto.randomBytes(32).toString('hex');
            const webhookSecret = crypto.randomBytes(32).toString('hex');

            client = new Client({
                client_id: 'truliv_prod_01',
                name: 'Truliv Properties',
                crm_provider: 'LeadSquared',
                bot_provider: 'Gallabox',
                api_credentials: {
                    internal_api_key: apiKey,
                    webhook_secret: webhookSecret,
                    crm_api_key: 'pending',
                    bot_api_key: 'pending'
                },
                status: 'active'
            });
            await client.save();
            console.log('Truliv Client Created');
        } else {
            console.log('Truliv Client Found');
        }

        // 2. Manage User
        // Remove old email-based user if exists to clean up
        await User.deleteOne({ email: 'admin@truliv.com' });

        const username = 'Trulivproperties';
        let user = await User.findOne({ username });

        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('tru#pro2025', salt);

            user = new User({
                username,
                password: hashedPassword,
                client_id: client._id,
                role: 'client_admin'
            });

            await user.save();
            console.log('Truliv Admin User Created');
            console.log('Username:', username);
            console.log('Password: tru#pro2025');
        } else {
            console.log('Truliv Admin User already exists');
            // Optional: Reset password if we want to ensure it's correct
            // const salt = await bcrypt.genSalt(10);
            // user.password = await bcrypt.hash('tru#pro2025', salt);
            // await user.save();
            // console.log('Password updated.');
        }

        process.exit();

    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};

seedTruliv();
