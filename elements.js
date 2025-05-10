// this will be available on my github in the near future
// for now this is a prototype

/** Utility function for quickly creating html elements */
export function create_element(data = {}) 
{

    // setup static variables
    const tag = data["tag"];
    const el = document.createElement(tag);


    /** handle custom attributes here */
    if (data['attr']) {
        // attr: { key: value, key: value }
        for (let [key, value] of Object.entries(data['attr'])) {
            el.setAttribute(key, value);
        }
    }
    
    /* handle an array of classes. can be a string or array */
    if (data['classes'])
    {
        el.classList.add(data['classes'])
    }
    /** handle appendchild, in a more intuitive way */
    if (data['insertin']) {
        data['insertin'].appendChild(el);
    }
    /** handle appendchild, in a more intuitive way */
    if (data['addtobody']) {
        document.body.appendChild(el);
    }
    /** insert an element *before* another element */
    if (data['insertbefore'])
    {
        data['insertbefore'].insertAdjacentElement('beforebegin', el)
    }
    /** insert an element *after* another element */
    if (data['insertafter'])
    {
        data['insertafter'].insertAdjacentElement('afterbegin', el)
    }
    // focus on elmeent
    if (data['focus'])
    {
        el.focus();
    }
    /** setup text */
    if (data['innerhtml'])
    {
        el.innerHTML = data['innerhtml'];
    }
        /** setup text */
    if (data['text'])
    {
        el.textContent = data['text'];
    }
    if (data['onclick'])
    {
        el.onclick = data['onclick'];
    }
    
    /** return reference to element? */
    if (data['getref']) {
        // warning: this has to be at the very bottom to unblock flow!
        return el;
    } 

}
