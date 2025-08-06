<h1 align="center" style="font-weight: bold">
  GPT Auth
  <br>
    <h3 align="center">Auth for your Custom GPT</h3>
  <br>
  
</h1>

**GPT Auth** provides a user-friendly solution to quickly setup oauth for your custom GPT and self-host it.

### Tutorial -> https://youtu.be/naJCyASboTk

## Key Features 🎯

- **Robust Security**: Tailored for Custom GPTs, ensuring protection against unauthorized access.
- **Access Control**: Effective monitoring and management of user access by GPT owners.
- **Easy Integration**: User-friendly setup, comprehensive guide, and intuitive dashboard.
- **Community & Support**: Access to a supportive community and dedicated developer support.
- **Interactive Demo & Documentation**: Hands-on demo and extensive documentation available.

### Stack

- Next.js
- Supabase
- Tailwind
- OpenAI
- Flask

---

## Getting Started

### Run the project locally

Minimum requirements to run the project locally:
- Node.js v18
- Python3
- Supabase Account

**1. Frontend (Next.js)**

First, set up your environment variables. Copy the `.env.example` file to a new file named `.env.local`:

```shell
cp .env.example .env.local
```

Open `.env.local` and add your Supabase project's **Publishable key (anon key)**.

Then, install dependencies and run the development server:

```shell
npm install
npm run dev
```

**2. Backend (Flask - Optional)**

The Python server is separate and can be run if needed for custom backend logic.

```shell
cd server
pip install -r requirements.txt
python webserver.py
```

---

## Deploy to Vercel

Deploying your GPT Auth frontend is easy with Vercel.

1.  **Push to GitHub**: Make sure your code is pushed to a GitHub repository.
2.  **Import Project**: Go to your Vercel dashboard and import the GitHub repository.
3.  **Configure Project**: Vercel will automatically detect that it's a Next.js project. The default settings should work perfectly.
4.  **Add Environment Variables**: In the project settings on Vercel, navigate to "Environment Variables" and add the following:
    -   `NEXT_PUBLIC_SUPABASE_URL`: Your project's Supabase URL.
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your project's publishable anon key.
5.  **Deploy**: Click the "Deploy" button. Vercel will build and deploy your site.

### Hosted version of GPT Auth

If you don't want to setup locally and wish to use a hosted version, you can start from https://gpt-auth.thesamur.ai/

### Demo

Here is a demo chatgpt plugin built with GPT Auth to test the entire flow of the app https://chat.openai.com/g/g-xx7FJpizE-gpt-auth