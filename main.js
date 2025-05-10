import { create_element } from "./elements.js";

/** initialise program here */
function main() {
    global.listeners.init();
    editor.init();
    sidebar.init();
    global.commands['open-global-modal'].command()
}

/** store core program states */
const states = {
    /** database states */
    database: {
        /** the database file name */
        file_name: null,
        /** stores the current article id */
        id: null,
        /** actual json text */
        json: null,
    },
    /** store the window hash */
    window: {
        hash: null
    },
};

/** modal class to handle custom modals */
const modal = {
    
    /** this is used for loading context-specific commands e.g. editor, elements, settings, text, etc. */
    commands: undefined,

    /** must be an array of objects */
    load: (commands_to_load = [{}]) => {
        modal.commands = commands_to_load;
    },

    create: () => {
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
            });

            const body = create_element({
                tag: 'div',
                getref: 1,
                classes: ['modal-results'],
                insertin: modal_container,
            });

            // generate command list based on the commands passed to the modal
            Object.entries(modal['commands']).forEach((object) => {
                
                /** since the commands struct is an object with values, we have to slice it's first key here (the command id) */
                const [command] = object.slice(1)

                // create buttons for each command
                const button = create_element({
                    tag: 'button',
                    text: command['title'],
                    classes: ['command'],
                    insertin: body,
                    attr: {type: 'submit',},
                    onclick: () => { command.command()},
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
                console.log(command)
                command[0].click();

            }
            else if (event.key === 'Escape') {
                modal.remove();
            }
        }
    },
    unlisten: () => {

    },
    toggle: () => {
        // if it doesn't already exist
        if (!(document.body.querySelector('.modal'))) {

            modal.create();
            modal.listen();

        // if exists
        } else {

            modal.remove();

        }
    },
    remove: () => {
        document.body.removeChild(document.querySelector('.modal'));
    }
}

/** component */
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
        
        refresh: () =>
        { 
            sidebar.elements.list.innerHTML = '';
            states.database.json.forEach((article) => {
                console.log(article);
                const li = create_element({
                    tag: 'li',
                    getref: 1,
                    insertin: sidebar.elements.list
                });
                const anchor = create_element({
                    tag: 'a',
                    getref: 1,
                    attr: {href: '#' + article['id']},
                    text: article['id'].replace(/-|#/g, ' '),
                    insertin: li,
                });

            })
        },
        toggle: () => {
            sidebar.elements.container.classList.toggle('is-hidden');
        },
        open: () => {
            sidebar.elements.container.classList.remove('is-hidden');
        }

    }
}

/** handles editor */
const editor = {

    /** initializing editor */
    init: () => { 

        editor.methods.clickable_elements(); 
        editor.methods.add_new_element_helper_button();

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

        /** update the article html with the parameter data */
        refresh: (params = {}) => {
            editor.elements.title.textContent = params['title']
            editor.elements.content.innerHTML = params['content']
        },

        /**  returns the article object match from the database  */
        query: (params = {}) => {
            // simply abstracts a .find() method
            // article.id === '123'
            return states.database.json.find((article) => { return article[params['type']] === params['term'] })
        },

        /** make elements in the editor clickable to edit */
        clickable_elements: () => {

            /** only these tags will be editable */
            const allowed_tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']

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

            const input = create_hidden_input();
            refresh_event_listeners();
            interact();


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
                    editor.methods.load({ filename: file.name, result: event.target.result });
                };

            }
        },

        /** what should happen when the database is loaded */
        load: (params = {}) => {
            states.database.json = JSON.parse(params['result']);
            states.database.file_name = params['filename'];
            sidebar.commands.refresh();
            sidebar.commands.open();
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


        "editor:add-paragraph":
        {
            title: "Add paragraph",
            description: "Add a paragarph",
            command: () => {  }
        },
        "editor:add-link":
        {
            title: "Add link",
            description: "Insert a link at cursor",
            command: () => { }
        },        
        "editor:add-image":
        {
            title: "Add image",
            description: "Add a image",
            command: () => {  }
        }

    }
}

/** global events */
const global = {

    /** setup non context-specific commands for the program */
    commands: {
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
    listeners: {

        init: () => {

            global.listeners.windowhashchange()
            global.listeners.hotkeys()

        },

        /** handle wndow hash change */
        windowhashchange: () => {
            // actual event
            window.addEventListener('hashchange', () => {

                // store hash in the global states
                states.window.hash = location.hash;

                // set current article to the hash
                states.database.id = states.window.hash.slice(1);

                /** query the article from the database to return it's data */
                const article = editor.methods.query({type: 'id', term: states.database.id})

                /** catch incorrect links or hash urls that don't point to existing articles */
                if (article) 
                {
                    /** refresh editor */
                    editor.methods.refresh({title: article['title'], content: article['content']})
                
                } else {

                    console.warn("Article not found for hash:", states.database.id);
                }

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

                        case 'x':
                            event.preventDefault();
                            global.commands['export-database'].command();
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