// Deploy with Supabase CLI. Set AI_API_KEY and optionally AI_API_URL / AI_MODEL as Edge Function secrets.
// Never put AI_API_KEY in GitHub Pages JavaScript.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), {status, headers:cors});
serve(async (req) => {
 if (req.method === "OPTIONS") return new Response("ok", {headers:cors});
 if (req.method !== "POST") return json({error:"Method not allowed"},405);
 const apiKey = Deno.env.get("AI_API_KEY");
 if (!apiKey) return json({error:"AI service is not configured. Please use sample practice for now."},503);
 let body: Record<string, unknown>;
 try { body = await req.json(); } catch { return json({error:"Invalid JSON body"},400); }
 const allowedExams = ["SSC CGL","SSC CHSL","SSC CPO","SSC GD","SSC MTS","SSC Stenographer","SSC Selection Post","SSC JE","SSC JHT","All SSC Exams"];
 const allowedSubjects = ["mixed","General Intelligence & Reasoning","Quantitative Aptitude","English","General Awareness"];
 const exam = typeof body.exam === "string" && allowedExams.includes(body.exam) ? body.exam : "SSC CGL";
 const subject = typeof body.subject === "string" && allowedSubjects.includes(body.subject) ? body.subject : "mixed";
 const count = typeof body.count === "number" ? Math.min(15,Math.max(1,Math.floor(body.count))) : 5;
 const apiUrl = Deno.env.get("AI_API_URL") || "https://api.openai.com/v1/chat/completions";
 const model = Deno.env.get("AI_MODEL") || "gpt-4o-mini";
 const prompt = `Create ${count} original practice MCQs for Indian SSC exam preparation. Exam: ${exam}. Subject: ${subject}. Level: moderate and exam-appropriate. These are AI-generated practice questions, NOT official previous-year questions. Return only JSON object {"questions":[{"subject":"one of General Intelligence & Reasoning, Quantitative Aptitude, English, General Awareness","q":"question","options":["A","B","C","D"],"answer":0,"explanation":"brief explanation"}]}. answer is zero-based index. Exactly 4 options. Avoid current affairs requiring today's facts. Ensure one unambiguously correct answer and no duplicate questions.`;
 try {
  const upstream = await fetch(apiUrl,{method:"POST",headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model,temperature:0.4,response_format:{type:"json_object"},messages:[{role:"system",content:"You are a careful competitive-exam practice-question writer. Do not claim AI content is official or verified."},{role:"user",content:prompt}]})});
  if (!upstream.ok) { console.error("AI provider status",upstream.status); return json({error:"AI provider request failed. Try sample practice or try again later."},502); }
  const data = await upstream.json(); const content = data?.choices?.[0]?.message?.content;
  let parsed; try { parsed = JSON.parse(content); } catch { return json({error:"AI provider returned invalid question data."},502); }
  if (!Array.isArray(parsed.questions)) return json({error:"AI provider did not return a question list."},502);
  const questions = parsed.questions.slice(0,count).filter((q: any) => typeof q.q === "string" && Array.isArray(q.options) && q.options.length===4 && Number.isInteger(q.answer) && q.answer>=0 && q.answer<4 && typeof q.explanation === "string").map((q: any,i:number)=>({id:`ai-${crypto.randomUUID()}-${i}`,subject:typeof q.subject==="string"?q.subject:subject,q:q.q,options:q.options.map(String),answer:q.answer,explanation:q.explanation,source:"AI-generated practice"}));
  if (!questions.length) return json({error:"No valid questions were generated. Please retry."},502);
  return json({questions,source:"AI-generated practice",notice:"AI-generated practice questions are not official previous-year questions. Check explanations against trusted sources."});
 } catch (e) { console.error("AI practice error",e); return json({error:"Could not generate questions right now. Please try again."},502); }
});
