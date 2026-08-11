I work in AI and security, and I want to develop a visualization based off of the original Google SAIF framework and the updated CoSAI Risk Map that I believe is the follow up work that they extended after Google donated SAIF to CoSAI.  

Here's the original SAIF map - it wa a great interactive website that walk users through various taxonomy terms, including Components, Risk, and Controls:
https://saif.google/secure-ai-framework/saif-map

They then donated to CoSAI Oasis, and CoSAI has a github repo that appears to extend it with a broader taxonomy that they call the CoSAI-RM (risk map):
https://github.com/cosai-oasis/secure-ai-tooling
https://github.com/cosai-oasis/secure-ai-tooling/tree/main/risk-map

I want to create a NextJS frontend application that replicates what the original SAIF map did (see the interactive website and pages), but this application should leverage the underlying CoSAI risk map, so in effecte extending googles original SAIF map with additional components and risk and others.  

First core task is to research both, including complete schema, and differences between the two, in order to create a new taxonomy for how we classify AI risks.  The second core task is to create a NextJS webapp based on the updated CoSAI taxonomy, similar to Googles original website with the risk map (see below).  The third task is to layer on top of the webapp flow to show a few exemplar AI incidents that occured due to agentic AI in the last few months, including the recent OpenAI-Huggingface incidemnt in July 2026 (https://youtu.be/87DyyMV0kCY?si=IjvVUnWxTupf17a4).

For the webapp:
The nextjs webapp should have a similar style to googles original SAIF, stepping through each risk and seeing where in the Componetns the risk is Introduced, Exposed and Mitigated (https://saif.google/secure-ai-framework/components; screenshot 1). With also a detailed tab for each of Componetns (https://saif.google/secure-ai-framework/components), Risks (https://saif.google/secure-ai-framework/risks; screenshot2), and Controls (https://saif.google/secure-ai-framework/controls; screenshot3)


Layering on real AI incidents:
You should search the web for the most high profile and impactful AI incidents/breaches/vulnerabilities that occured due to Agentic AI over the last 4-6 months.  Choose 3-5 examples, which are the most impactful and publicized, and research deeply, ensuring you capture the componennts where the attacks were introduced/exposed/mitigated, in relation to the CoSAI-RM.  We should also categorize the general attack patterns of AI breaches/incidents/risks so tht we can map them back to CoSAI risks and the mappings to e.g. OWASP otp 10.  Once we have a full understanding of the attacks, we would then want to add a visualization tab called Examples that would map these flows onto the webapp.  

The webapp should be interactive like the original SAIF, you can use your playwright tool to interact with it and click through the app to understand how it's set up (previous and next buttons that show the componetns on the right, and highlight where the introduced/exposed/mitigated occur for each risk; see screenshot sequence). Note for the agentic risks (e.g. rouge actions) they have a more detailed component map (last screnshot). CoSAI may represent this dffierently based on their taxonomy, but it should be set up in a similar web app look and feel.  

So in summary: we want to create a webapp viz that replicates what Google SAIF risk map does, but update it to use CoSAI-RM and to include example AI breaches/incidents/attacks as additional overlay.  

Create the plan to build this out. Use NextJS and launch it locally on localhost for testing 