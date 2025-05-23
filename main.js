/** dependencies */
import { create_element } from "./elements.js";

/** initialise program here */
function main() {

    global.methods.resethash();
    global.listeners.init();
    editor.init();
    sidebar.init();
    mouse.selection.init();
    
}

/** store core program states */
const states = {
    /** database states */
    database: {
        /** the database file name */
        file_name: null,
        /** stores a target article id */
        id: null,
        /** stores a target article object */
        article: null, 
        /** actual json text */
        json: null,
    },
    /** store the window hash */
    window: {
        hash: null,
    },
};

/** custom mouse behavior */
const mouse = {

    selection: {
            container: undefined,
            startx: undefined,
            starty: undefined,
            create: (event) => {
                mouse.selection.container = create_element({ tag: 'div', attr: { id: "selection-box" }, addtobody: true, getref: 1,  });
                mouse.selection.startx = event.clientX;
                mouse.selection.starty = event.clientY;
                mouse.selection.container.style.left = `${mouse.selection.startx}px`;
                mouse.selection.container.style.top = `${mouse.selection.starty}px`;
            },
            mousemove: (event) => {

                

                const width = event.clientX - mouse.selection.startx;
                const height = event.clientY - mouse.selection.starty;

                mouse.selection.container.style.width = `${Math.abs(width)}px`;
                mouse.selection.container.style.height = `${Math.abs(height)}px`;

                if (width < 0) mouse.selection.container.style.left = `${event.clientX}px`;
                if (height < 0) mouse.selection.container.style.top = `${event.clientY}px`;       
            },

            mouseup: (event) => {
                document.removeEventListener('mousemove', mouse.selection.mousemove);
                document.removeEventListener('mouseup', mouse.selection.mouseup);
                mouse.selection.container.remove();
            },
            mousedown: () => {
                document.addEventListener('mousedown', (event) => {
                    // event.preventDefault();
                    mouse.selection.create(event);
                    document.addEventListener('mousemove', mouse.selection.mousemove);
                    document.addEventListener('mouseup', mouse.selection.mouseup);
                })
            },
            init: () => {
                mouse.selection.mousedown();
            }
    }
    
}

/** create custom user prompts */
const prompt = {

    /** prompt user for input. if cancelled or incorrect, throws a safe error */
    input: (params = {}) => {

        // store input
        let input;

        // * block execution until the prompt is complete
        while (true) {

            // store the prompt result in input var
            input = window.prompt(params['placeholder']);

            // * if input is cancelled
            if (input === null) {
                // * show user of incorrect alrt
                alert("Invalid input! Please enter a valid file ID.");
                throw new Error("User canceled input. Cannot proceed without an ID.");
            }

            // * if input is not empty
            if (input.trim() !== "") {
                return input.trim(); // Valid input returned
            }

        }
    }

}

/** modal class to handle modals with context-specific commands */
const modal = {
    
    /** this is used for loading context-specific commands e.g. editor, elements, settings, text, etc. */
    commands: undefined,

    /** initializing the modal here. */
    init: () => {

        modal.create();
        modal.parse();
        modal.listen();
    
    },

    /** dynamically create the html */
    create: () => {

        const container = create_element({
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
            insertin: container,
        });

        const body = create_element({
            tag: 'div',
            getref: 1,
            classes: ['modal-results'],
            insertin: container,
        });

    },

    /** load commands into the modal. must be an array, and each command must be an object with values like this: "id": { keys: values, keys: values, ... } */
    load: (commands = []) => {

        /** loads the commands into the modal */
        modal.commands = commands;
    },
    /** genreate the list of commands inside the modal */
    parse: () => {
        // query the body of the modal
        const body = document.querySelector('.modal .modal-results');

        // generate command list based on the commands passed to the modal
        Object.entries(modal['commands']).forEach((object) => {

            // since the commands struct is an object with values, we have to slice it's first key here (whcih is the command id) */
            const [command] = object.slice(1)

            // create buttons for each command
            const button = create_element({

                tag: 'button',
                text: command['title'],
                classes: ['command'],
                insertin: body,
                attr: { type: 'submit', },

                // the command that will run when the button is clicked
                onclick: () => { 

                    // set a 0ms timeout so we can chain commands together (if needed)
                    setTimeout(() => { 
                        
                        // run the command() 
                        command.command() 

                    }, 0); 
                },   
                
                getref: 1,
            
            });
            // create description for command
            create_element({
                tag: 'p',
                text: command['description'],
                insertin: button
            })
        });
    },
    /** handles all modal input events */
    listen: () => {
        // query the altready created commands
        const html_command_buttons = document.querySelectorAll('.command');
        const modal = document.querySelector('.modal');
        const input = modal.querySelector('input');

        // remove pre-existing event listeners
        input.removeEventListener('keydown', key_handler);
        input.removeEventListener('input', input_handler);
        modal.removeEventListener('click', modal_click_handler);

        // handle event listeners
        input.addEventListener('keydown', (event) => { key_handler(event) })
        input.addEventListener('input', (event) => { input_handler(event) });
        modal.addEventListener('click', (event) => { modal_click_handler(event)});

        /** handle clicks */
        function modal_click_handler(event) {
            
            /** remove the modal when user clicks on button */
            if (event.target.tagName === 'BUTTON') {
                modal.remove();
            }
        }

        // handle text input
        function input_handler(event) {
            // santize input
            const search = event.target.value.toLowerCase().trim();

            // loop through each command
            html_command_buttons.forEach((command) => {

                const commandtext = command.textContent.toLocaleLowerCase().trim();

                // if it matches with the search
                if (commandtext.includes(search)) {

                    command.removeAttribute('style')

                } else {

                    command.style.display = 'none';
                }
            })
        }

        /** handle hotkeys */
        function key_handler(event) {
            if (event.key === 'Enter') {

                const command = Array.from(document.querySelectorAll(".command")).filter(el => getComputedStyle(el).display !== "none");
                command[0].click();

            }
            else if (event.key === 'Escape') {
                modal.remove();
            }
        }
    },
    toggle: () => {

        // if it doesn't already exist
        if (!(document.body.querySelector('.modal'))) {

            modal.init();

        // if exists
        } else {

            modal.remove();

        }
    },
    remove: () => {
        document.body.removeChild(document.querySelector('.modal'));
    }
}

/** sidebar component */
const sidebar = {

    /** main function */
    init: () => { 

        /** handle the button to toggle the sdiebar */
        sidebar.elements.button.onclick = () => { sidebar.commands.toggle(); };

     },

    /** html elements for this component */
    elements: {
        container: document.querySelector('aside'),
        button: document.querySelector('button.toggle'),
        list: document.querySelector('aside ul'),
        nav: document.querySelector('aside nav'),
    },

    /** commands to be accessible from outside */
    commands: {
        
        /** reveal any link in the sidebar */
        link: (id) => {

            const cssclass = 'active-link'

            // * query the anchor link with the specific link
            const anchor = sidebar.elements.list.querySelector(`a[href="#${id}"]`);
            
            // refresh & update classes
            document.querySelectorAll(`a.${cssclass}`).forEach((a) => { a.classList.remove(cssclass) })
            
            anchor.classList.add(cssclass);

            anchor.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        /** generate a list of links from all database files */
        list: () => {
            states.database.json.forEach((article) => {
                const li = create_element({
                    tag: 'li',
                    getref: 1,
                    insertin: sidebar.elements.list
                });
                const anchor = create_element({
                    tag: 'a',
                    getref: 1,
                    attr: { href: '#' + article['id'] },
                    text: article['id'].replace(/-|#/g, ' '),
                    insertin: li,
                });

            })
        },
        /** completely refresh the sidebar view */
        refresh: () =>
        { 
            sidebar.elements.list.innerHTML = '';
            sidebar.commands.list();
        },
        /** simple toggle on/off */
        toggle: () => {
            sidebar.elements.container.classList.toggle('is-hidden');
        },
        /** force open the sidebar */
        open: () => {
            sidebar.elements.container.classList.remove('is-hidden');
        }

    }
}

/** file structs & templates */
const file = {
    
    default: {

        "id": null,
        "title": null,
        "date": new Date().now,
        "content": "<p contenteditable=\"true\"></p>"
    
    }
}

/** handles editor */
const editor = {

    /** initializing editor */
    init: () => { 

        editor.methods.welcome();
        editor.methods.clicktoedit(); 

    },

    /** html interface */
    elements: {
        article: document.querySelector('article'),
        title: document.querySelector('article h1.title'),
        content: document.querySelector('article .content'),
        properties: document.querySelector('article table.properties tbody'),
    },

    /** internal methods */
    methods: {

        /** simply removes the innerHTML of an element */
        refresh: {
            
            properties: () => {

                // delete any previous html
                const table = editor.elements.properties
                table.innerHTML = '';

                
                const article = states.database.article;
                console.log(article)

                // store properties
                const properties = Object.entries(article);
     
                // parse properties into table rows
                properties.forEach(([k, v]) => {


                    const row = create_element({
                        tag: 'tr',
                        getref: 1,
                        insertin: table
                    });

                    function parsekey() {
                        create_element({
                            tag: 'td',
                            text: k,
                            insertin: row
                        });
                    }

                    function parseval() {
                        create_element({
                            tag: 'td',
                            text: v,
                            insertin: row
                        });
                    }

                    // skip properties that are empty
                    if (v === '' || v.length === 0 ){

                        create_element({
                            tag: 'td',
                            text: k,
                            insertin: row
                        });

                        create_element({
                            tag: 'td',
                            text: 'No value',
                            insertin: row
                        });

                    } else {

                        // handle rendering specific properteis here
                        switch (k) {
                            case 'id':
                                break;

                            case 'content':
                                break;

                            case 'tags':
                                parsekey();

                                // value
                                v.forEach((tag) => {
                                    const td = create_element({
                                        tag: 'td',
                                        getref: 1,
                                        insertin: row
                                    });
                                    const a = create_element({
                                        tag: 'a',
                                        text: tag,
                                        classes: 'tag',
                                        attr: { href: '#' + tag },
                                        insertin: td
                                    })
                                })
                                break;

                            // all other properties without types
                            default:
                                parsekey();
                                parseval();
                                break;

                        }
                    }
                });

                create_element({
                    tag: 'button',
                    text: '+ Add property',
                    insertin: table,
                    onclick: () => { editor.commands['add-property'].command(); }
                })
                
            },
            content: () => {
                editor.elements.content.innerHTML = '';
            },
            title: () => {
                editor.elements.title.innerHTML = '';
            }
        },

        file: {

            /** creates a new file & adds to the database */
            create: () => {

                try {

                    /** create a new file object */
                    const f = new Object(file.default);

                    /** use a prompt to get user input */
                    const input = prompt.input({placeholder: "Please enter a valid file ID:"});

                    /** set the input to the new file id & title */
                    f['id']          = input;
                    f['title']       = input;

                    // trigger a hash change
                    location.hash = f.id

                    // push to database
                    const database = states.database.json;
                    database.push(f) 

                    // events that happen after file is created
                    sidebar.commands.refresh();
                    editor.elements.title.setAttribute('contenteditable', 'true')
                    editor.elements.title.focus();

                } catch (err) {

                    console.error(err.message);

                }

            },

        },
        /** temporary welcome page */
        welcome: () => {

            const button = create_element({
                tag: 'button',
                onclick: () => { button.remove(); editor.methods.import(); },
                attr: {type: 'button'},
                text: 'Import database',
                getref: 1,
                insertin: editor.elements.content,
            })
        },

        /** load the article title & content into the html */
        read: (params = {}) => {

            editor.elements.title.textContent = params['title']
            editor.elements.content.innerHTML = params['content']

        },
        /** update the article html with the parameter data */
        render: (params = {}) => {

            editor.methods.read(params)          
            editor.methods.refresh.properties();

        },

        /**  returns the article object match from the database  */
        query: (params = {}) => {
            // simply abstracts a .find() method
            // article.id === '123'
            return states.database.json.find((article) => { return article[params['type']] === params['term'] })
        },

        /** make elements in the editor clickable to edit */
        clicktoedit: () => {

            /** only these tags will be editable */
            const allowed_tags = ['li', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']

            /** listen for the mouse click to make the elements editable */
            editor.elements.article.addEventListener('click', (event) => {
                if (allowed_tags.includes(event.target.tagName.toLowerCase())) {
                    event.target.setAttribute('contenteditable', 'true');
                    event.target.focus();
                }

            })

        },

        /** call this function to programatically click a hidden file input & import a file  */
        import: () => {

            /** main */
            const input = create_hidden_input();
            refresh_event_listeners();
            interact();


            /** functions */
            function refresh_event_listeners() {
                input.removeEventListener('change', handle_input_file_change);
                input.addEventListener('change', handle_input_file_change);
            }

            function create_hidden_input() {
                return create_element({
                    tag: 'input',
                    attr: {
                        type: 'file',
                        accept: '.json',
                        style: 'display: none'
                    },
                    getref: 1
                });
            }

            function interact() {
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
            }

            function handle_input_file_change(event) {


                // Get the selected file
                const file = event.target.files[0];
                console.info('File loaded:', file.name);

                // setup filereader api
                const reader = new FileReader();
                reader.readAsText(file);

                // in this stage, the file is open & loaded
                reader.onload = (event) => {
                    
                    global.events.editorimport(event);

                };

            }
        },

        loadarticle: () => {
            /** store state as variable */
            const article = states.database.article;

            /** catch incorrect links or hash urls that don't point to existing articles */
            if (article) {
                
                const title_or_id = article['title'] ? article['title'] : article['id'];
                const tags = article['tags'] ? article['tags'] : null

                /** refresh editor by passing in the database article data */
                editor.methods.render({ title: title_or_id, content: article['content'], tags: tags })

            } else {

                console.warn("Article not found for hash:", states.database.id);
            }
        },

        /** export the current database as a json file */
        export: () => {

            /** this uses the hidden link trick to download the blob as a json file */
            const output_file_name = 'database.json';
            const parsed_json = JSON.stringify(states.database.json);
            const blob = new Blob([parsed_json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = url;
            a.download = output_file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        /** handles input listening inside the editor */
        listen: () => {
            // refresh any pre-existing listeners
            editor.methods.unlisten();
            editor.elements.article.addEventListener('input', editor.methods.write);
        },

        /** remove input event listener */
        unlisten: () => {
            editor.elements.article.removeEventListener('input', editor.methods.write)
        },
        
        /** save html to the database state */
        write: () => {

            // static variables for verbosity
            const title = editor.elements.title.textContent;
            const content = editor.elements.content.innerHTML;
            const article = editor.methods.query({ type: 'id', term: states.database.id })

            
            // * write the html content to the article
            article['content'] = content;
            article['title'] = title;
            
            // log
            console.log({ title: title, content: content, id: article, });

        },

        /** adds a helper button for quickly adding elements */
        add_new_element_helper_button: () => {
            
            /** create if it doesn't exist */
            if (!(editor.elements.article.querySelector('button.element-adder-helper'))) {

                const button = create_element({
                    tag: 'button',
                    attr: { type: 'button' },
                    classes: ['element-adder-helper'],
                    text: '+ Add new element',
                    insertin: editor.elements.article,
                    onclick: () => { global.commands['open-editor-modal'].command() },
                    getref: 1,
                });

            }
        }

    },

    /** core commands */
    commands: {

        /** adds a property to the current file */
        "add-property":
        {
            title: "Add property",
            description: "Add a property to this file",
            command: () => { 

                // static variables for property & value
                const property = prompt.input({ placeholder: "Name" });
                const value = prompt.input({ placeholder: "Value" });
                
                // get the article from the database
                const article = states.database.article;
                
                // set the new property & value
                Object(article)[property] = value;

                // refersh properties
                editor.methods.refresh.properties();
                 
             }
        },

        "add-paragraph":
        {
            title: "Paragraph",
            description: "Add a paragarph",
            command: () => { 
                
                create_element({
                    tag: 'p',
                    insertin: editor.elements.content,
                    attr: {'contenteditable': 'true'},
                    focus: 1,
                });
                
            }
        },
        "editor:add-table":
        {
            title: "Table",
            description: "Add a table",
            command: () => { }
        },        
        "editor:add-heading-1":
        {
            title: "H1",
            description: "Add a heading level 1",
            command: () => { }
        }, 
        "editor:add-heading-2":
        {
            title: "H2",
            description: "Add a heading level 2",
            command: () => { }
        },         
        "editor:add-heading-3":
        {
            title: "H3",
            description: "Add a heading level 3",
            command: () => { }
        },      
        "editor:add-link":
        {
            title: "Link",
            description: "Insert a link at cursor",
            command: () => { }
        },        
        "editor:add-image":
        {
            title: "Image",
            description: "Add a image",
            command: () => {  }
        },
        "editor:extract-selection":
        {
            title: "Extract selection",
            description: "Extract selection to a file",
            command: () => {  }
        }

    }
}

/** global events */
const global = {

    /** global utils & methods */
    methods: {

        /** remove the hash on every visit */
        resethash: () => {
            
            if (window.location.hash) {
                history.replaceState(null, '', window.location.pathname);
            }
            
        },
        /** updates the window hash, id & article */
        updatestates: (params = {}) => {

            if (params['file']){

                // global state: store hash 
                states.window.hash = params['file'];
    
                // set current article id to the hash
                states.database.id = states.window.hash.slice(1);
    
                /** query the article from the database to return it's data */
                states.database.article = editor.methods.query({ type: 'id', term: states.database.id })
            }
            if (params['json']){
                states.database.json = JSON.parse(params['json']);
            }
            if (params['filename']){
                states.database.file_name = params['filename'];
            }

        },
    },
    /** setup non context-specific commands for the program */
    /** global.commands['open-global-modal'].command() */
    commands: {
        "search-files":
        {
            title: "Search files",
            description: "Search between files",
            command: () => {  }
        },
        "create-new-file": {
            title: "Create new file",
            description: "Create new file",
            command: () => {editor.methods.file.create(); }
        },
        "open-editor-modal":
        {
            title: "Open editor modal",
            description: "Opens the editor modal",
            command: () => { modal.load(editor.commands); modal.toggle(); }
        },
        "open-global-modal":
        {
            title: "Open global modal",
            description: "Opens the global modal",
            command: () => { modal.load(global.commands); modal.toggle(); }
        },
        "open-database-matrix": {
            title: "Open database matrix",
            description: "Opens all your files as a database",
            command: () => {},
        },
        "toggle-sidebar":
        {
            title: "Toggle the sidebar",
            description: "Opens",
            command: () => { sidebar.commands.toggle(); }
        },        
        "import-database":
        {
            title: "Import database",
            description: 'Import a JSON database file',
            command: () => { editor.methods.import(); },
        },
        "export-database":
        {
            title: "Export database",
            description: 'Export a JSON database file',
            command: () => { editor.methods.export(); }
        }
    },
    /** handle all major program events here */
    events: {
    
        /** event when window hash change  */
        windowhashchange: () => {

            global.methods.updatestates({ file: window.location.hash });
            editor.methods.loadarticle();
            sidebar.commands.link(states.database.id); 
       
        },

        editorexport: (event) => {},

        /** what should happen when the database is loaded */
        editorimport: (event) => {

            global.methods.updatestates({json: event.target.result, filename: event.target.name })            
            sidebar.commands.refresh();
            sidebar.commands.open();
            editor.methods.listen();
            editor.methods.add_new_element_helper_button();

        },

    },
    /** global listeners */
    listeners: {

        /** intialize listeners here */
        init: () => {

            global.listeners.windowhashchange()
            global.listeners.hotkeys()

        },

        /* this will run each function inside global.events.windowhashchange */
        windowhashchange: () => {

            window.addEventListener('hashchange', () => {

                global.events.windowhashchange()

            });
        },

        /** setup global hotkeys for the program */
        hotkeys: () => {
            document.addEventListener('keydown', (event) => {

                // for hotkeys using ctrl
                if (event.ctrlKey) {

                    // cycle through each ctrl + key
                    switch (event.key) {
                        case 'i':
                            event.preventDefault();
                            global.commands['import-database'].command();
                            break;

                        case 'e':
                            event.preventDefault();
                            global.commands['export-database'].command();
                            break;
                            
                        case 'o':
                            event.preventDefault();
                            global.commands['open-file'].command();
                            break;

                        case 'p':
                            event.preventDefault();
                            global.commands['open-global-modal'].command();
                            break;

                        case '[':
                            event.preventDefault();
                            sidebar.commands.toggle();
                            break;
                    }
                }
            });
        },
    }

}

/** run the main function after everything */
main();