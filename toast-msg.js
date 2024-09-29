const tmpl = document.createElement("template");
tmpl.innerHTML = `
   <style>
      :host {
         contain: content;
         min-inline-size: 2rem;
         max-inline-size: 70vw;
         border: none;
         border-radius: 5px;
         background-color: aliceblue;
         font-weight: bold;
         box-shadow: 2px 2px 4px #c1c1c1, -2px 2px 4px #c1c1c1;
         position: fixed;
         inset-block-start: auto;
      }

      div {
         text-align: center;
         padding: 0.25rem 0.5rem;
      }
   </style>

   <div part="container"></div>
`;


// usage: new ToastMsg(true | false | "some text")
class ToastMsg extends HTMLElement {
   #text = "✔";
   #defaultMsgTime = 500;
   #msgTime;
   #dirSign = 1;

   constructor(content, msgTime, rtl) {
      super();

      // calc content
      if (typeof content == "boolean") this.#text = content ? "✔" : "✗";
      else if (content) this.#text = content; // else => #text =  (default) "✔"

      if (msgTime > 0) this.#msgTime = msgTime;
      //else this.msgTime == undefined => use defaults
      
      if (typeof rtl == "boolean") this.#dirSign = rtl ? -1 : 1;
      else if (rtl == "rtl") this.#dirSign = -1; // else = default 1

      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(tmpl.content.cloneNode(true));
      
      const div = this.shadowRoot.querySelector("div");
      div.textContent = this.#text;
      
      this.setAttribute('role', 'status');

      // use popover if available
      if (HTMLElement.prototype.hasOwnProperty("popover")) this.popover = "manual";
   }

   connectedCallback() {
      if (HTMLElement.prototype.hasOwnProperty("popover")) this.showPopover();
      let msgTime;
      if (this.#text == "✔") {
         this.style.fontSize = "150%";
         this.style.color = "green";
         msgTime = this.#msgTime ?? this.#defaultMsgTime;
      }
      else if (this.#text == "✗") {
         this.style.fontSize = "150%";
         this.style.color = "var(--color-danger, #dc3545)";
         msgTime = this.#msgTime ?? this.#defaultMsgTime;
      }
      else msgTime = this.#msgTime ??
         Math.min(5000, Math.max(this.#defaultMsgTime, 60 * this.#text.length)); // each char introduces additional 60ms

      console.log(msgTime);
      const width = Math.max(64, this.offsetWidth); // 54px ~ 4rem
      this.style.insetInlineStart = `${-width}px`; // make it off the screen
      
      if (this.#dirSign > 0) this.style.insetInlineStart = `${-width}px`;
      else this.style.insetInlineEnd = `${-width}px`;

      const allToastMsgs = document.querySelectorAll("toast-msg");
      if (allToastMsgs.length > 1) {
         let minTop = Number.MAX_SAFE_INTEGER, currTop;
         for (let i = 0; i < allToastMsgs.length - 1; i++) {
            if (this == allToastMsgs[i]) continue;
            currTop = allToastMsgs[i].getBoundingClientRect().top;
            if (currTop < minTop ) minTop = currTop;
         }

         this.style.insetBlockEnd = `calc(100vh - ${minTop - 4}px)`;
      }
      else this.style.insetBlockEnd = "8px"; // this msg is the 1st

      if (this.#dirSign > 0) this.style.insetInlineEnd = "auto";
      else this.style.insetInlineStart = "auto";

      this.animate([
         { transform: `translateX(${this.#dirSign*(width + 8)}px)` }],
         { duration: 500, easing: "ease-out", fill: "forwards" }
      ).finished.then(() => {
         this.animate([
            { transform: `translateX(${-this.#dirSign * width}px)` }],
            { delay: `${msgTime}`, duration: 500, easing: "ease-out", fill: "forwards" }
         ).finished.then(() => {
            this.remove();
         });
      });
   }
}

customElements.define("toast-msg", ToastMsg);

export default ToastMsg;
