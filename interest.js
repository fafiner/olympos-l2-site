import { getLocale } from "./i18n.js";
import { CLASSES } from "./interest-options.js";
const dialog = document.querySelector("#interest-dialog");
const form = document.querySelector("#interest-form");
const opener = document.querySelector("#interest-open");
const submit = form.querySelector('[type="submit"]');
const status = document.querySelector("#interest-status");
const classSelect = form.elements.className;
for (const name of CLASSES) { const option = document.createElement("option"); option.value=name; option.textContent=name; classSelect.append(option); }
const copy = {
 "pt-BR": {sending:"Enviando…", submit:"Confirmar interesse",success:"Interesse registrado! Obrigado por fazer parte do Olympos.",invalid:"Confira o nickname, a classe e selecione pelo menos um estilo de jogo.",duplicate:"Esse nickname já está na lista de interessados. Isso não significa que ele está reservado no jogo.",rate:"Muitos envios em pouco tempo. Tente novamente mais tarde.",unavailable:"Não foi possível registrar agora. Seus dados continuam no formulário; tente novamente.",undecided:"Ainda não decidi"},
 en: {sending:"Sending…",submit:"Confirm interest",success:"Interest registered! Thank you for joining Olympos.",invalid:"Check your nickname, class and select at least one play style.",duplicate:"This nickname is already on the interest list. This does not reserve it in-game.",rate:"Too many submissions. Please try again later.",unavailable:"We could not save your interest. Your form is still filled in; please try again.",undecided:"Not decided yet"},
 es: {sending:"Enviando…",submit:"Confirmar interés",success:"¡Interés registrado! Gracias por formar parte de Olympos.",invalid:"Revisa el nickname, la clase y elige al menos un estilo de juego.",duplicate:"Este nickname ya está en la lista de interesados. No significa que esté reservado en el juego.",rate:"Demasiados envíos. Inténtalo más tarde.",unavailable:"No pudimos registrar tu interés. Tus datos siguen en el formulario; inténtalo de nuevo.",undecided:"Todavía no lo decidí"}
};
let pending=false, statusKey="";
function refresh() { const c=copy[getLocale()]||copy["pt-BR"]; submit.textContent=pending?c.sending:c.submit; classSelect.options[1].textContent=c.undecided; if(statusKey) status.textContent=c[statusKey]; }
function showStatus(key) { statusKey=key; refresh(); }
opener.addEventListener("click",()=>{dialog.showModal(); form.elements.nickname.focus();});
dialog.querySelector(".interest-close").addEventListener("click",()=>dialog.close());
dialog.addEventListener("close",()=>opener.focus());
window.addEventListener("olympos:language-change",refresh);
form.addEventListener("submit",async event=>{
 event.preventDefault();
 if(pending || form.hidden) return;
 const styles=[...form.querySelectorAll('[name="styles"]:checked')].map(input=>input.value);
 if(!form.reportValidity() || !styles.length) { showStatus("invalid"); return; }
 pending=true; submit.disabled=true; statusKey=""; refresh();
 const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),12000);
 try {
  const response=await fetch("/api/interest",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({nickname:form.elements.nickname.value.trim(),className:classSelect.value,styles,consent:form.elements.consent.checked,website:form.elements.website.value})});
  const data=await response.json();
  if(response.ok && data.ok===true) { form.hidden=true; showStatus("success"); }
  else showStatus(["invalid","duplicate","rate"].includes(data.code)?data.code:"unavailable");
 } catch { showStatus("unavailable"); }
 finally { clearTimeout(timer); pending=false; submit.disabled=false; refresh(); }
});
refresh();


