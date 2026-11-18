/**
 * Runs before first paint (inline in <head>). The hero intro plays once per browser session;
 * after that html[data-intro="seen"] shortens it to a quick settle (see .intro-* in globals.css).
 */
export const INTRO_SCRIPT = `try{if(sessionStorage.getItem('seen-intro')){document.documentElement.dataset.intro='seen'}else{sessionStorage.setItem('seen-intro','1')}}catch(e){}`;
