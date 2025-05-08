import { create_element } from "./elements.js";
let database = {};
let current_article_id = undefined;

const nav = document.querySelector('nav')
const article = document.querySelector('article');
const title = article.querySelector('h1.title');
const content = article.querySelector('.content');







/** main global stuff */
const sidebar = create_sidebar();
sidebar.render();
make_listeneable();






// window hash change events
window.addEventListener('hashchange', () => 
{
    const hash = window.location.hash;
    current_article_id = hash.replace('#', '');
    render_article_display();
});






function create_sidebar()
{
    /** main variables */
    const button = document.querySelector('button.toggle');
    const sidebar = document.querySelector('aside');
    const list = sidebar.querySelector('ul')


    /** handle toggle logic  */
    function toggle_handler() {
        
        button.onclick = () => { toggle(); };
        
        document.addEventListener('keydown', (e) => {
            if (e.key === '[' && e.ctrlKey) {
                toggle();
            }
        });
    }
    /** hide/show sidebar */
    function toggle()
    {
        sidebar.classList.toggle('is-hidden');
    }
    function open()
    {
        button.click();
    }

    /** render list with links from database */
    function refresh() {
        database.forEach((entry) => {
    
            const li = document.createElement('li');
            const anchor = document.createElement('a');
            anchor.href = '#' + entry['id'];
            anchor.textContent = entry['id'].replace(/-|#/g, ' ');
            li.appendChild(anchor);
            list.appendChild(li);
        });
    }
    
    return {
        render: () => { toggle_handler(); },
        refresh: () => { refresh(); open(); },
    }
}




// commands
const commands = [
    {
        title: "Help",
        description: "Open this editor's readme file"
    },
    {
        title: "Import database",
        description: 'Import a JSON database file',
        action: () => { import_handler(); }
    },
    {
        title: "Export database",
        description: 'Export a JSON database file',
        action: () => { }
    },
    {
        title: 'Edit database',
        description: 'Open an editable database view',
        action: () => { }
    },
    {
        title: 'Sync site CSS',
        description: 'Sync the CSS of a remote site URL',
        action: () => {}
    },
    {
        title: 'Open settings',
        description: 'Open settings',
        action: () => { }
    }
];









// modal

// you can toggle the modal on/off wiht a hotkey (e.g. ctrl P)
document.addEventListener('keydown', (input) => {
    if (input.key === 'p' && input.ctrlKey) {
        input.preventDefault();
        modal_toggle();
    }
})

// logic to toggle modal
function modal_toggle() {

    // if it doesn't already exist
    if (!(document.body.querySelector('.modal'))) {

        create_modal();
        handle_modal_input_events();

        // if exists
    } else {

        remove_modal();
    }
}

// remove modal
function remove_modal() {
    document.body.removeChild(document.querySelector('.modal'));
}

// create the html elements
function create_modal() {
    const modal_container = create_element({
        tag: 'div',
        classes: ['modal'],
        addtobody: 1,
        getref: 1
    });

    const input = create_element({
        tag: 'input',
        getref: 1,
        attr: { type: 'text', placeholder: 'Search command' },
        focus: true,
        insertin: modal_container,
        // listen: {type: 'input', function: () => {}}
    });

    const results = create_element({
        tag: 'div',
        getref: 1,
        classes: ['modal-results'],
        insertin: modal_container,
    });

    // generate command list
    commands.forEach((command) => {
        // create buttons for each command
        const button = create_element({
            tag: 'button',
            text: command['title'],
            classes: ['command'],
            insertin: results,
            attr: {type: 'submit'},
            onclick: command['action'],
            getref: 1,
        });
        // create description for command
        create_element({
            tag: 'p',
            text: command['description'],
            insertin: button
        })
    });
};

// handle all the input in the modal
function handle_modal_input_events() {
    // query the altready created commands
    const commands = document.querySelectorAll('.command');

    // query the altready created input
    const input = document.querySelector('.modal input');
    const modal = document.querySelector('.modal');

    // remove pre-existing event listeners
    input.removeEventListener('keydown', key_handler);
    input.removeEventListener('input', input_handler);
    modal.removeEventListener('click', () => { });

    // handle clicking on button (aswell as button execute)
    modal.addEventListener('click', (event) => {

        if (event.target.tagName === 'BUTTON') {
            remove_modal();
        }
    })

    // handle event listeners
    input.addEventListener('keydown', (event) => { key_handler(event) })
    input.addEventListener('input', (event) => { input_handler(event) });

    // handle text input
    function input_handler(event) {
        // santize input
        const search = event.target.value.toLowerCase().trim();

        // loop through each command
        commands.forEach((cmd) => {

            const cmd_text = cmd.textContent.toLocaleLowerCase().trim();

            // if it matches with the search
            if (cmd_text.includes(search)) {
                cmd.removeAttribute('style')

            } else {
                cmd.style.display = 'none';
            }
        })
    }
    /** handle hotkeys */
    function key_handler(event) {
        if (event.key === 'Enter') {
            const commands = document.querySelectorAll('.command');
            commands[0].click();
        }
        else if (event.key === 'Escape') {
            remove_modal();
        }
    }
}


/** call this function to programatically click a hidden file input & import a file  */
function import_handler() {
    
    const input = create_element({
        tag: 'input', 
        attr: 
        {
            type: 'file', 
            accept: '.json', 
            style: 'display: none'
        },
        getref: 1
    });
    
    // event listeners refreshing & adding
    input.removeEventListener('change', handle_input_file_change);
    input.addEventListener('change', handle_input_file_change);
    
    // temporarily interact with the input
    document.body.appendChild(input); 
    input.click();                    
    document.body.removeChild(input); 

    /** event when loading a file into the database variable */
    function handle_input_file_change(event) {
    
        // Get the selected file
        const file = event.target.files[0];
        console.log('File loaded:', file.name);
    
        const reader = new FileReader();
        reader.onload = function (e) {
    
            // json file text data
            database_read_event(e);
        };
    
        // handle it as text
        reader.readAsText(file);
    }
    
}

function reset_window_hash()
{
    // reset the hash on every visit
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname);
    }
}
function database_read_event(e) {
    database = JSON.parse(e.target.result);
    sidebar.refresh();
    reset_window_hash();
    render_article_display();
}

function render_article_display()
{
    
    const article = database.find((article) => article['id'] === current_article_id);
    title.innerText = article['title'] === '' ? article['id'] : article['title'];
    nav.innerText = article['id'];
    content.innerHTML = article['content'];

}

function make_listeneable()
{
    const allowed_tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    article.addEventListener('click', (event) => {
        if (allowed_tags.includes(event.target.tagName.toLowerCase()))
        {
            event.target.setAttribute('contenteditable', 'true');
        }
    })
}

modal_toggle();