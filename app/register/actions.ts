"use server";

import { redirect } from "next/navigation";

export async function registerAction(formData: FormData)  {
    const email = String(formData.get("email")?? "");
    const fullName = String(formData.get("fullName")?? "");
    const password = String(formData.get("password") ?? "");
    const userType = String(formData.get("userType") ?? "");

    const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            Email: email,
            FullName: fullName,
            Password: password,
            UserType: userType,
        }),
    });

    if(!response.ok) {
        const meessage = await extractErrorMessage(response);
        redirect(`/register?error=${encodeURIComponent(meessage)}`)
    }

    redirect("/login?registered=1");
}

 async function extractErrorMessage(response: Response): Promise<string> {
     const text = await response.text();
     if (!text) {
    return "Something went wrong. Please try again.";
  }
    
    try {
        const data = JSON.parse(text);
        if(Array.isArray(data)) {
            return data.join(" ");
        }

        if (data.errors) {
          return Object.values(data.errors).flat().join(" ");
        }
    }
     catch (error) {
       
    }

     return "Something went wrong. Please try again.";
}