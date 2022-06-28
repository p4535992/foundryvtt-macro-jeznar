// https://hackmd.io/@akrigline/ByHFgUZ6u/%2FojFSOsrNTySh9HbzTE3Orw
console.log(`
██████████████████████████████████████████
███▄─▄█▄─▄▄─█░▄▄░▄█▀▀▀▀▀██▄─▄███▄─▄█▄─▄─▀█
█─▄█─███─▄█▀██▀▄█▀█████████─██▀██─███─▄─▀█
▀▄▄▄▀▀▀▄▄▄▄▄▀▄▄▄▄▄▀▀▀▀▀▀▀▀▄▄▄▄▄▀▄▄▄▀▄▄▄▄▀▀`)

/*************************************************************************************
 * Register the module with Developer Mode
 *************************************************************************************/
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(jez.ID);
});

/*************************************************************************************
 * Create a Class for our Module to hold all my nifty functions
 *************************************************************************************/
class jez {
    static ID = 'jez-lib';
    static TEMPLATES = {
        TODOLIST: `modules/${this.ID}/templates/todo-list.hbs`
    }

    static contents() {
        let functions = `
  addMessage(chatMessage, msgParm) -- add text message to specified chat message.
  log(...parms) -- depending on developer mode debug flag writes messages to console.    
  postMessage(msgParm) -- post a new message to the game chat, optioanlly with parms.
  wait(ms) -- async call to waith for ms milliseconds`
        console.log("")
        console.log("Jez-lib includes a number of functions.")
        console.log(functions)
        console.log("")
    }

    /***************************************************************************************************
     * DEBUG Logging
     * 
     * If passed an odd number of arguments, put the first on a line by itself in the log,
     * otherwise print them to the log seperated by a colon.  
     * 
     * If more than two arguments, add numbered continuation lines. 
     * 
     * Ex: jez.log("Post this message to the console", variable)
     ***************************************************************************************************/
    static log(...parms) {
        if (game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID) === false) return (true)
        let numParms = parms.length;    // Number of parameters received
        let i = 0;                      // Loop counter
        let lines = 1;                  // Line counter 

        if (numParms % 2) {  // Odd number of arguments
            console.log(this.ID, '|', parms[i++])
            for (i; i < numParms; i = i + 2) console.log(this.ID, '|', ` (${lines++})`, parms[i], ":", parms[i + 1]);
        } else {            // Even number of arguments
            console.log(this.ID, '|', parms[i], ":", parms[i + 1]);
            i = 2;
            for (i; i < numParms; i = i + 2) console.log(this.ID, '|', ` (${lines++})`, parms[i], ":", parms[i + 1]);
        }
    }

    /***************************************************************************************************
     * Post a new chat message -- msgParm should be a string for a simple message or an object with 
     * some or all of these fields set below for the chat object.  
     * 
     * Example Calls:
     *  jez.postMessage("Hi there!")
     *  jez.postMessage({color:"purple", fSize:18, msg:"Bazinga", title:"Sheldon says..." })
     *  jez.PostMessage({color:"purple", fSize:18, msg:"Bazinga", title:"Sheldon says...", token:aToken})
     ***************************************************************************************************/
    static async postMessage(msgParm) {
        const FUNCNAME = "postMessage(msgParm)";
        // jez.log(`--- Starting ${FUNCNAME} ---`,msgParm);
        let typeOfParm = typeof (msgParm)
        let chatCard = msgParm
        let speaker = null              // The speaking Token
        if (typeOfParm === "object") {
            if (msgParm?.token) {       // If a speaking token is defined it must be a Token5e
                // jez.log("msgParm.token?.constructor.name", msgParm.token?.constructor.name)
                if (msgParm.token?.constructor.name !== "Token5e") {
                    let msg = `Coding error. Speaking Token (${msgParm?.token?.name}) is a 
                               ${msgParm.token?.constructor.name} must be a Token5e`
                    ui.notifications.error(msg)
                    // jez.log(msg)
                    return (null)
                }
            }
            const CHAT = {
                title: msgParm?.title || "Generic Chat Message",
                fSize: msgParm?.fSize || 12,
                color: msgParm?.color || "black",
                icon: msgParm?.icon || "icons/vtt-512.png",
                msg: msgParm?.msg || "Maybe say something useful...",
                token: msgParm?.token || null       // Token5e that is speaking
            }
            speaker = CHAT.token
            // jez.log("speaker", speaker)
            chatCard = `
            <div class="dnd5e chat-card item-card midi-qol-item-card">
                <header class="card-header flexrow">
                    <img src="${CHAT.icon}" title="${CHAT.title}" width="36" height="36">
                    <h3 class="item-name">${CHAT.title}</h3>
                </header>
                <div class="card-buttons">
                    <p style="color:${CHAT.color};font-size:${CHAT.fSize}px">
                        ${CHAT.msg}</p>
                </div>
            </div>`
        }
        //await ChatMessage.create({ content: chatCard });
        await ChatMessage.create({
            //speaker: ChatMessage.getSpeaker(controlledToken),
            speaker: speaker ? ChatMessage.getSpeaker(speaker) : null,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: chatCard
        });

        await jez.wait(100);
        await ui.chat.scrollBottom();
        // jez.log(`-------------- Finished ${FUNCNAME}-----------`);
        return;
    }

    /***************************************************************************************************
     * addMessage to specified chatMessage.  This presumes it is a Midi-QoL style HTML chat card.
     * chatMessage frequently obtained like so:
     *  let chatMessage = game.messages.get(args[args.length - 1].itemCardId);
     *  
     * Example Calls:
     *  jez.addMessage(chatMessage, "Hi there!")
     *  jez.addMessage(chatMessage,{color:"purple",fSize:14,msg:"Bazinga, Sheldon Wins!",tag:"saves"})
     * 
     * If msgParm is provided as an object
     * @typedef  {Object} msgParm
     * @property {number} fSize   - Font Size, 12 matches typical Foundry font
     * @property {string} color   - Name or hex code, https://www.w3schools.com/tags/ref_colornames.asp
     * @property {string} msg     - Actual text to be posted into chat
     * @property {string} tag     - Tag mapping into HTML from: saves, attack, damage, hits, other   
     ***************************************************************************************************/
    static async addMessage(chatMessage, msgParm) {
        const FUNCNAME = "postChatMessage(chatMessage, msgParm)";
        // jez.log(`-------------- Starting ${FUNCNAME} -----------`);
        const allowedTags = ["saves", "attack", "damage", "hits", "other"]
        //-----------------------------------------------------------------------------------------------
        // chatMessage must be a ChatMessage object
        //
        if (chatMessage?.constructor.name !== "ChatMessage") {
            let errMsg = `Coding error. Chat message passed (${chatMessage}) is a ${chatMessage?.constructor.name}, must be ChatMessage.`
            console.log("--- ERROR ---", errMsg)
            ui.notifications.error(errMsg)
            return (false)
        }
        //-----------------------------------------------------------------------------------------------
        // chatMsg will be a simple string unless msgParm is an object
        //
        let chatTag = "saves"   // Default value
        let chatMsg = msgParm;
        if (typeof (msgParm) === "object") {
            const CHAT = {
                fSize: msgParm?.fSize || 14,
                color: msgParm?.color || "purple",
                msg: msgParm?.msg || "Maybe say something useful...",
                tag: msgParm?.tag || "saves-display"
            }
            chatMsg = `<div class="card-buttons"><p style="color:${CHAT.color};font-size:${CHAT.fSize}px">${CHAT.msg}</p></div>`
            if (!allowedTags.includes(CHAT.tag)) {
                ui.notifications.error(`Coding error. ${CHAT.tag} is not a defined anchor word`)
                return (false)
            }
            chatTag = CHAT.tag
        }
        // jez.log("chatMsg", chatMsg)
        //-----------------------------------------------------------------------------------------------
        // Put correct suffix on the chatTag
        //
        switch (chatTag) {
            case "saves":
            case "hits": chatTag += "-display"; break;
            case "attack":
            case "damage":
            case "other": chatTag += "-roll"; break;
        }
        // jez.log("chatTag", chatTag)
        //-----------------------------------------------------------------------------------------------
        // Add our new text to the HTML using a RegEx which needs to be built
        //
        const searchString = `<div class="end-midi-qol-${chatTag}">`;
        const regExp = new RegExp(searchString, "g");
        const replaceString = `<div class="end-midi-qol-${chatTag}">${chatMsg}`;
        let content = await duplicate(chatMessage.data.content);
        content = await content.replace(regExp, replaceString);
        await chatMessage.update({ content: content });

        await jez.wait(100);
        await ui.chat.scrollBottom();
        // jez.log(`-------------- Finished ${FUNCNAME}-----------`);
        return;
    }
    /***************************************************************************************************
     * getRange
     * 
     * Obtain the range defined on specified item as long as the units are in allowed units
     ***************************************************************************************************/
    static getRange(itemD, allowedUnits) {
        let range = itemD.data.range?.value;
        let unit = itemD.data.range?.units;
        // jez.log("range", range, "unit", unit);
        if (!allowedUnits.includes(unit)) {
            let msg = `Unit ${unit} not in allowed units`
            // jez.log(msg, allowedUnits);
            ui.notifications.warn(msg);
            return (0);
        }
        return (range);
    }
    /***************************************************************************************************
     * inRange
     *
     * Check to see if two entities are in range with 4 foot added
     * to allow for diagonal measurement to "corner" adjacancies
     ***************************************************************************************************/
    static inRange(token1, token2, maxRange) {
        //----------------------------------------------------------------------------------------------
        // Tokens need to be Token5e not TokenDocument5e, so check and convert if needed.
        //
        let t1 = {}
        if (token1.constructor.name === "TokenDocument5e") t1 = token1._object
        else t1 = token1
        let t2 = {}
        if (token2.constructor.name === "TokenDocument5e") t2 = token2._object
        else t2 = token2
        //----------------------------------------------------------------------------------------------
        // Determine the 5e distance between tokens
        //
        let distance = jez.getDistance5e(t1, t2)
        //----------------------------------------------------------------------------------------------
        // Return result 
        //
        if (distance > maxRange) {
            let msg = `jez.inRange: Distance between ${token1.name} and ${token2.name} is ${distance}`
            // jez.log(msg);
            return (false);
        }
        return (true);
    }
    /***************************************************************************************************
     * getDistance in the wierd D&D 5e alternate world where diagonals are 5-10-5 distances
     * 
     * Logic taken from Vance Cole's macro: https://github.com/VanceCole/macros/blob/master/distance.js
     *
     * Return distance between two placeables
     ***************************************************************************************************/
    static getDistance5e(one, two) {
        let gs = canvas.grid.size;
        let d1 = Math.abs((one.x - two.x) / gs);
        let d2 = Math.abs((one.y - two.y) / gs);
        let maxDim = Math.max(d1, d2);
        let minDim = Math.min(d1, d2);
        let dist = (maxDim + Math.floor(minDim / 2)) * canvas.scene.data.gridDistance;
        return dist;
    }
    /***************************************************************************************************
     * tokensInRange
     * 
     * Function that returns an array of the tokens that are within a specified range -or- null if no
     * tokens are in range from the specified token. Exclude the origin token.
     ***************************************************************************************************/
    static async tokensInRange(sel, range) {
        let inRangeTokens = [];
        let toFarCnt, inRangeCnt = 0
        let toFar = ""
        let fudge = 4 //fudge factor to allow diagonals to work better
        //----------------------------------------------------------------------------------------------
        // Check the types of parameters passed 
        //
        if (sel?.constructor.name !== "Token5e") {
            let msg = `Coding error. Selection (${sel}) is a ${sel?.constructor.name} must be a Token5e`
            ui.notifications.error(msg)
            console.log(msg)
            return (null)
        }
        if (typeof (range) !== "number") {
            let msg = `Coding error. Range (${range}) is a ${typeof (range)} must be a number`
            ui.notifications.error(msg)
            console.log(msg)
            return (null)
        }
        //----------------------------------------------------------------------------------------------
        // Perform the interesting bits
        //
        canvas.tokens.placeables.forEach(token => {
            let d = canvas.grid.measureDistance(sel, token);
            d = d.toFixed(1);
            if (sel === token) { // Skip the origin token
                // jez.log(` Skipping the origin token, ${sel.name}`, "sel", sel, "token", token)
            } else {
                // jez.log(` Considering ${token.name} at ${d} distance`);
                if (d > range + fudge) {
                    // jez.log(`  ${token.name} is too far away`);
                    if (toFarCnt++) { toFar += ", " };
                    toFar += token.name;
                    // jez.log(`  To Far #${toFarCnt} ${token.name} is ${d} feet. To Fars: ${toFar}`);
                } else {
                    // jez.log(`  ${token.name} is in range`);
                    inRangeTokens.push(token);
                    inRangeCnt++;
                    // jez.log(`  In Range #${inRangeCnt} ${token.name} is ${d} feet. In Ranges:`, inRangeTokens);
                }
            }
        });
        if (!inRangeCnt) return (null)
        return (inRangeTokens)
    }
    /***************************************************************************************
     * Create and process check box dialog, passing array onto specified callback function
     * 
     * Font Awesome Icons: https://fontawesome.com/icons
     * 
     * const queryTitle = "Select Item in Question"
     * const queryText = "Pick one from following list"
     * pickCallBack = call back function
     * queryOptions array of strings to be offered as choices, perhaps pre-sorted 
     * 
     * Sample Call:
     *   const queryTitle = "Select Item in Question"
     *   const queryText = "Pick one from the list" 
     *   pickCheckListArray(queryTitle, queryText, pickRadioCallBack, actorItems.sort());
     ***************************************************************************************/
    static async pickCheckListArray(queryTitle, queryText, pickCallBack, queryOptions) {
        const FUNCNAME = "jez.pickFromList(queryTitle, queryText, ...queryOptions)";
        // jez.log("---------Starting ---${FUNCNAME}-------------------------------------------",
        //     `queryTitle`, queryTitle,
        //     `queryText`, queryText,
        //     `pickCallBack`, pickCallBack,
        //     `queryOptions`, queryOptions);
        let msg = ""
        if (typeof (pickCallBack) != "function") {
            msg = `pickFromList given invalid pickCallBack, it is a ${typeof (pickCallBack)}`
            ui.notifications.error(msg);
            // jez.log(msg);
            return
        }
        if (!queryTitle || !queryText || !queryOptions) {
            msg = `pickFromList arguments should be (queryTitle, queryText, pickCallBack, [queryOptions]),
   but yours are: ${queryTitle}, ${queryText}, ${pickCallBack}, ${queryOptions}`;
            ui.notifications.error(msg);
            // jez.log(msg);
            return
        }
        let template = `
<div>
<label>${queryText}</label>
<div class="form-group" style="font-size: 14px; padding: 5px; border: 2px solid silver; margin: 5px;">
`   // Back tick on its on line to make the console output better formatted
        for (let option of queryOptions) {
            template += `<input type="checkbox" id="${option}" name="selectedLine" value="${option}"> <label for="${option}">${option}</label><br>
`   // Back tick on its on line to make the console output better formatted
        }
        template += `</div></div>`
        // jez.log(template)

        let selections = []
        new Dialog({
            title: queryTitle,
            content: template,
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Selected Only',
                    callback: async (html) => {
                        // jez.log("html contents", html)

                        html.find("[name=selectedLine]:checked").each(function () {
                            //jez.log($(this).val());
                            selections.push($(this).val())
                        })
                        pickCallBack(selections)
                    },
                },
                all: {
                    icon: '<i class="fas fa-check-double"></i>',
                    label: 'All Displayed',
                    callback: async (html) => {
                        //jez.log("Selected All", queryOptions)
                        pickCallBack(queryOptions)
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: async (html) => {
                        console.log('canceled')
                        pickCallBack(null)
                    },
                },
            },
            default: 'cancel',
        }).render(true)
        // jez.log(`--------Finished ${FUNCNAME}----------------------------------------`)
        return;
    }
    /***************************************************************************************
     * Create and process selection dialog, passing it onto specified callback function
     * 
     * const queryTitle = "Select Item in Question"
     * const queryText = "Pick one from drop down list"
     * pickCallBack = call back function
     * queryOptions array of strings to be offered as choices
     ***************************************************************************************/
    static async pickFromListArray(queryTitle, queryText, pickCallBack, queryOptions) {
        const FUNCNAME = "jez.pickFromList(queryTitle, queryText, ...queryOptions)";
        // jez.log("---------Starting ---${FUNCNAME}-------------------------------------------",
        //     `queryTitle`, queryTitle,
        //     `queryText`, queryText,
        //     `pickCallBack`, pickCallBack,
        //     `queryOptions`, queryOptions);
        let msg = ""

        if (typeof (pickCallBack) != "function") {
            msg = `pickFromList given invalid pickCallBack, it is a ${typeof (pickCallBack)}`
            ui.notifications.error(msg);
            console.log(msg);
            return
        }

        if (!queryTitle || !queryText || !queryOptions) {
            msg = `pickFromList arguments should be (queryTitle, queryText, pickCallBack, [queryOptions]),
               but yours are: ${queryTitle}, ${queryText}, ${pickCallBack}, ${queryOptions}`;
            ui.notifications.error(msg);
            console.log(msg);
            return
        }

        let template = `
    <div>
    <div class="form-group">
        <label>${queryText}</label>
        <select id="selectedOption">`
        for (let option of queryOptions) {
            template += `<option value="${option}">${option}</option>`
        }
        template += `</select>
    </div></div>`

        new Dialog({
            title: queryTitle,
            content: template,
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'OK',
                    callback: async (html) => {
                        const selectedOption = html.find('#selectedOption')[0].value
                        // jez.log('selected option', selectedOption)
                        pickCallBack(selectedOption)
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: async (html) => {
                        // jez.log('canceled')
                        pickCallBack(null)
                    },
                },
            },
            default: 'cancel',
        }).render(true)

        // jez.log(`--------Finished ${FUNCNAME}----------------------------------------`)
        return;
    }
    /***************************************************************************************
     * Create and process radio button dialog, passing it onto specified callback function
     * 
     * const queryTitle = "Select Item in Question"
     * const queryText = "Pick one from following list"
     * pickCallBack = call back function
     * queryOptions array of strings to be offered as choices, perhaps pre-sorted
     * 
     * Sample Call:
     *   const queryTitle = "Select Item in Question"
     *   const queryText = "Pick one from the list" 
     *   pickRadioListArray(queryTitle, queryText, pickRadioCallBack, actorItems.sort());
     ***************************************************************************************/
    static async pickRadioListArray(queryTitle, queryText, pickCallBack, queryOptions) {
        const FUNCNAME = "jez.pickFromList(queryTitle, queryText, ...queryOptions)";
        // jez.log("---------Starting ---${FUNCNAME}-------------------------------------------",
            // `queryTitle`, queryTitle,
            // `queryText`, queryText,
            // `pickCallBack`, pickCallBack,
            // `queryOptions`, queryOptions);
        let msg = ""
        if (typeof (pickCallBack) != "function") {
            msg = `pickFromList given invalid pickCallBack, it is a ${typeof (pickCallBack)}`
            ui.notifications.error(msg);
            console.log(msg);
            return
        }
        if (!queryTitle || !queryText || !queryOptions) {
            msg = `pickFromList arguments should be (queryTitle, queryText, pickCallBack, [queryOptions]),
           but yours are: ${queryTitle}, ${queryText}, ${pickCallBack}, ${queryOptions}`;
            ui.notifications.error(msg);
            console.log(msg);
            return
        }
        let template = `
    <div>
    <label>${queryText}</label>
    <div class="form-group" style="font-size: 14px; padding: 5px; border: 2px solid silver; margin: 5px;">
    `   // Back tick on its on line to make the console output better formatted
        for (let option of queryOptions) {
            template += `<input type="radio" id="${option}" name="selectedLine" value="${option}"> <label for="${option}">${option}</label><br>
    `   // Back tick on its on line to make the console output better formatted
        }
        template += `</div></div>`
        // jez.log(template)

        new Dialog({
            title: queryTitle,
            content: template,
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'OK',
                    callback: async (html) => {
                        // jez.log("html contents", html)
                        const SELECTED_OPTION = html.find("[name=selectedLine]:checked").val();
                        // jez.log("Radio Button Selection", SELECTED_OPTION)
                        // jez.log('selected option', SELECTED_OPTION)
                        await pickCallBack(SELECTED_OPTION) // Trying await before the call back -Jez
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: async (html) => {
                        // jez.log('canceled')
                        pickCallBack(null)
                    },
                },
            },
            default: 'cancel',
        }).render(true)
        // jez.log(`--------Finished ${FUNCNAME}----------------------------------------`)
        return;
    }
    /***************************************************************************************************
     * getSize of passed token and return an object with information about that token's size.   
     * If a problem occurs getting the size, false will be returned.  
     *  
     * Example Call:
     *  let sizeObj = jez.getSize(tToken)
     * 
     * The returned object will be composed of:
     * @typedef  {Object} CreatureSizes
     * @property {integer} value  - Numeric value of size: 1 is tiny to 6 gargantuan
     * @property {string}  str    - Short form for size generally used in FoundryVTT data 
     * @property {string}  string - Spelled out size all lower case
     * @property {string}  String - Spelled out size with the first letter capitalized   
     ***************************************************************************************************/
    static async getSize(token1) {
        class CreatureSizes {
            constructor(size) {
                this.str = size;
                switch (size) {
                    case "tiny": this.value = 1; this.string = "tiny"; this.String = "Tiny"; break;
                    case "sm": this.value = 2; this.string = "small"; this.String = "Small"; break;
                    case "med": this.value = 3; this.string = "medium"; this.String = "Medium"; break;
                    case "lg": this.value = 4; this.string = "large"; this.String = "Large"; break;
                    case "huge": this.value = 5; this.string = "huge"; this.String = "Huge"; break;
                    case "grg": this.value = 6; this.string = "gargantuan"; this.String = "Gargantuan"; break;
                    default: this.value = 0;  // Error Condition
                }
            }
        }
        let token1SizeString = token1.document._actor.data.data.traits.size;
        let token1SizeObject = new CreatureSizes(token1SizeString);
        let token1Size = token1SizeObject.value;  // Returns 0 on failure to match size string
        if (!token1Size) {
            let message = `Size of ${token1.name}, ${token1SizeString} failed to parse.<br>`;
            jez.// jez.log(message);
            ui.notifications.error(message);
            return (false);
        }
        // jez.log(` Token1: ${token1SizeString} ${token1Size}`)
        return (token1SizeObject)
    }
    /*************************************************************************************
     * wait for parm milliseconds.
     * 
     * ex: await jez.wait(1000) // Wait for 1 second
     *************************************************************************************/
    static async wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
    /***************************************************************************************************
     * Return a random, darkish color name (string)
     ***************************************************************************************************/
    // COOL-THING: Pick a random (dark) color name 
    static randomDarkColor() {
        let colorArray = ["Blue", "BlueViolet", "Brown", "Crimson", "DarkBlue", "DarkMagenta", "DarkRed",
            "FireBrick", "ForestGreen", "Maroon", "MidnightBlue", "Olive", "Purple", "RebeccaPurple",
            "RoyalBlue", "SaddleBrown", "SlateBlue", "SteelBlue", "Teal"];
        // Returns a random integer from 0 to (colorArray.length - 1):
        let index = Math.floor(Math.random() * colorArray.length);
        return (colorArray[index])
    }

    /***************************************************************************************************
     * Get token5e object based on ID passed
     ***************************************************************************************************/
     static getTokenById(tokenId) {
        if ((typeof (tokenId) != "string") || (tokenId.length !== 16)) {
            let msg = `Parameter passed to jez.getTokenById(tokenId) is not an ID: ${tokenId}`
            ui.notifications.error(msg)
            // jez.log(msg)
            return (false)
        }
        return (canvas.tokens.placeables.find(ef => ef.id === tokenId));
    }
    /***************************************************************************************************
    * Return casting stat string based on input: Token5e, TokenID, Actor5e
    ***************************************************************************************************/
    static getCastStat(subject) {
        let actor5e = null
        if (typeof (subject) === "object") { // Hopefully we have a Token5e or Actor5e
            if (subject.constructor.name === "Token5e") actor5e = subject.actor
            else if (subject.constructor.name === "Actor5e") actor5e = subject
            else {
                let msg = `Object passed to jez.getCastStat(subject) is type '${typeof (subject)}' must be a Token5e or Actor5e`
                ui.notifications.error(msg)
                // jez.log(msg)
                return (false)
            }
        } else if ((typeof (subject) === "string") && (subject.length === 16)) actor5e = jez.getTokenById(subject).actor
        else {
            let msg = `Parameter passed to jez.getCastStat(subject) is not a Token5e, Actor5e, or Token.id: ${subject}`
            ui.notifications.error(msg)
            // jez.log(msg)
            return (false)
        }
        return (actor5e.data.data.attributes.spellcasting)
    }
    /***************************************************************************************************
     * Return spell save DC string based on input: Token5e, TokenID, Actor5e
     ***************************************************************************************************/
         static getSpellDC(subject) {
            let actor5e = null
            if (typeof (subject) === "object") { // Hopefully we have a Token5e or Actor5e
                if (subject.constructor.name === "Token5e") actor5e = subject.actor
                else if (subject.constructor.name === "Actor5e") actor5e = subject
                else {
                    let msg = `Object passed to jez.getCastStat(subject) is type '${typeof (subject)}' must be a Token5e or Actor5e`
                    ui.notifications.error(msg)
                    // jez.log(msg)
                    return (false)
                }
            } else if ((typeof (subject) === "string") && (subject.length === 16)) actor5e = jez.getTokenById(subject).actor
            else {
                let msg = `Parameter passed to jez.getCastStat(subject) is not a Token5e, Actor5e, or Token.id: ${subject}`
                ui.notifications.error(msg)
                // jez.log(msg)
                return (false)
            }
            return (actor5e.data.data.attributes.spelldc)
        }
    /***************************************************************************************************
    * Return casting stat mod integer based on input: Token5e, TokenID, Actor5e and stat string
    ***************************************************************************************************/
    static getStatMod(subject, statParm) {
        let actor5e = null
        let stat = ""
        const STAT_ARRAY = ["str", "dex", "con", "int", "wis", "cha"]   // Allowed stat strings
        //----------------------------------------------------------------------------------------------
        // Validate the subject parameter, stashing it into "actor5e"
        //
        if (typeof (subject) === "object") { // Hopefully we have a Token5e or Actor5e
            if (subject.constructor.name === "Token5e") actor5e = subject.actor
            else if (subject.constructor.name === "Actor5e") actor5e = subject
            else {
                let msg = `Object passed to jez.getCastStat(subject,statParm) is type '${typeof (subject)}' must be a Token5e or Actor5e`
                ui.notifications.error(msg)
                console.log(msg)
                return (false)
            }
        } else if ((typeof (subject) === "string") && (subject.length === 16)) actor5e = jez.getTokenById(subject).actor
        else {
            let msg = `Subject parm passed to jez.getCastStat(subject,statParm) is not a Token5e, Actor5e, or Token.id: ${subject}`
            ui.notifications.error(msg)
            console.log(msg)
            return (false)
        }
        //----------------------------------------------------------------------------------------------
        // Validate the statParm parameter and stash it into "stat"
        //
        if ((typeof (statParm) !== "string") || (statParm.length !== 3)) {
            let msg = `Stat parameter passed to jez.getCastStat(subject, statParm) is invalid: ${statParm}`
            ui.notifications.error(msg)
            console.log(msg)
            return (false)
        }
        stat = statParm.toLowerCase();
        if (!STAT_ARRAY.includes(stat)) {
            let msg = `Stat parameter passed to jez.getCastStat(subject, statParm) is invalid: ${statParm}`
            ui.notifications.error(msg)
            console.log(msg)
            return (false)
        }
        //----------------------------------------------------------------------------------------------
        // Fetch and return that modifier
        //
        return (actor5e.data.data.abilities[stat].mod)
    }
    /***************************************************************************************************
    * Return casting modifier integer based on input: Token5e, TokenID, Actor5e
    ***************************************************************************************************/
    static getCastMod(subject) {
        let stat = jez.getCastStat(subject)
        if (!stat) return (false)
        return (jez.getStatMod(subject, stat))
    }
    /***************************************************************************************************
    * Return proficency modifier
    ***************************************************************************************************/
    static getProfMod(subject) {
        let actor5e = null
        if (typeof (subject) === "object") { // Hopefully we have a Token5e or Actor5e
            if (subject.constructor.name === "Token5e") actor5e = subject.actor
            else if (subject.constructor.name === "Actor5e") actor5e = subject
            else {
                let msg = `Object passed to jez.getCastStat(subject) is type '${typeof (subject)}' must be a Token5e or Actor5e`
                ui.notifications.error(msg)
                console.log(msg)
                return (false)
            }
        } else if ((typeof (subject) === "string") && (subject.length === 16)) actor5e = jez.getTokenById(subject).actor
        else {
            let msg = `Parameter passed to jez.getCastStat(subject) is not a Token5e, Actor5e, or Token.id: ${subject}`
            ui.notifications.error(msg)
            console.log(msg)
            return (false)
        }
        return (actor5e.data.data.attributes.prof)
    }
    /***************************************************************************************************
     * Obtain and return the character level of the passed token, actor or token.id
     ***************************************************************************************************/
    static getCharLevel(subject) {
        //----------------------------------------------------------------------------------------------
        // Convert the passed parameter to Actor5e
        //
        let actor5e = null
        if (typeof (subject) === "object") { // Hopefully we have a Token5e or Actor5e
            if (subject.constructor.name === "Token5e") actor5e = subject.actor
            else if (subject.constructor.name === "Actor5e") actor5e = subject
            else {
                let msg = `Object passed to jez.getCharacterLevel(subject) is type '${typeof (subject)}' 
            must be a Token5e or Actor5e`
                ui.notifications.error(msg)
                console.log(msg)
                return (false)
            }
        } else if ((typeof (subject) === "string") && (subject.length === 16))
            actor5e = jez.getTokenById(subject).actor
        else {
            let msg = `Parameter passed to jez.getCharacterLevel(subject) is not a Token5e, Actor5e, or 
        Token.id: ${subject}`
            ui.notifications.error(msg)
            console.log(msg)
            return (false)
        }
        //----------------------------------------------------------------------------------------------
        // Find the Actor5e's character level.
        //
        let charLevel = 0
        // PC's can have multiple classes, add them all up
        for (const CLASS in actor5e.data.data.classes) charLevel += actor5e.data.data.classes[CLASS].levels
        // NPC's don't have classes, use CR instead
        if (!charLevel) charLevel = actor5e.data.data.details.cr
        return (charLevel)
    }
    /***************************************************************************************
     * Function to delete all copies of a named item of a given type from actor
     *
     * Parameters
     *  - itemName: A string naming the item to be found in actor's inventory
     *  - subject: actor, token, or token Id to be searched
     *  - type: type of item to be deleted, e.g. spell, weapon 
     ***************************************************************************************/
    static async deleteItems(itemName, type, subject) {
        let itemFound = null
        let message = ""
        let actor5e = null
        //----------------------------------------------------------------------------------------------
        // Validate the subject parameter, stashing it into "actor5e" variable
        //
        if (typeof (subject) === "object") {                   // Hopefully we have a Token5e or Actor5e
            if (subject.constructor.name === "Token5e") actor5e = subject.actor
            else {
                if (subject.constructor.name === "Actor5e") actor5e = subject
                else {
                    message = `Object passed to jez.deleteItems(...) is type 
                '${typeof (subject)}' must be a Token5e or Actor5e`
                    ui.notifications.error(message)
                    console.log(message)
                    return (false)
                }
            }
        } else {
            if ((typeof (subject) === "string") && (subject.length === 16))
                actor5e = jez.getTokenById(subject).actor
            else {
                message = `Subject parm passed to jez.deleteItems(...) is not a Token5e, 
            Actor5e, or Token.id: ${subject}`
                ui.notifications.error(message)
                console.log(message)
                return (false)
            }
        }
        //----------------------------------------------------------------------------------------------
        // Validate that Type is a string.
        //
        if (typeof (type) != "string") {
            message = `Type parm passed to jez.deleteItems(...) is '${typeof (type)}'.  It
        must be a string identifying a FoundryVTT item type (e.g. spell, weapon).`
            ui.notifications.error(message)
            console.log(message)
            return (false)
        }
        //----------------------------------------------------------------------------------------------
        // Look for matches and delete them.  Generating a message for each deletion
        //
        while (itemFound = actor5e.items.find(item => item.data.name === itemName &&
            item.type === type)) {
            // jez.log("itemFound", itemFound)
            await itemFound.delete();
            message = `Deleted ${type}: "${itemName}"`      // Set notification message
            ui.notifications.info(message);
            // jez.log(message);
        }
    }
    /***************************************************************************************************
     * Define static constants for use by other functions.  They are accessed like..
     * 
     * console.log(jez.ADD + jez.OVERRIDE) // 7
     ***************************************************************************************************/
     static get CUSTOM()     { return 0 }
     static get MULTIPLY()   { return 1 }
     static get ADD()        { return 2 }
     static get DOWNGRADE()  { return 3 }
     static get UPGRADE()    { return 4 }
     static get OVERRIDE()   { return 5 }
     static get DAEFLAG_FAMILIAR_NAME() { return "familiar_name" }
     static get ACTOR_UPDATE_MACRO() { return "ActorUpdate"}
     static get TOKEN_REFRESH_MACRO() { return "TokenRefresh"}
     /***************************************************************************************************
      * Set the Familiar name into the DAE Flag
      ***************************************************************************************************/
     static async familiarNameSet(actor5e, name) {
         return (await DAE.setFlag(actor5e, jez.DAEFLAG_FAMILIAR_NAME, name));
     }
     /***************************************************************************************************
      * Get the Familiar name from the DAE Flag, return empty string if not found
      ***************************************************************************************************/
     static async familiarNameGet(actor5e) {
         let currentName = await DAE.getFlag(actor5e, jez.DAEFLAG_FAMILIAR_NAME);
         // jez.log("currentName", currentName)
         if (!currentName) currentName = ""
         return (currentName)
     }
     /***************************************************************************************************
      * Get the Familiar name from the DAE Flag, return empty string if not found
      ***************************************************************************************************/
    static async familiarNameUnset(actor5e) {
        return (await DAE.unsetFlag(actor5e, jez.DAEFLAG_FAMILIAR_NAME));
    }
    /***************************************************************************************************
     * Retrieve and return the spell school string formatted for jb2a from the passed item or false if 
     * none found.
     ***************************************************************************************************/
    static getSpellSchool(item) {
        let school = item?.data?.school
        if (!school) return (false)
        switch (school) {
            case "abj": school = "abjuration"; break
            case "con": school = "conjuration"; break
            case "div": school = "divination"; break
            case "enc": school = "enchantment"; break
            case "evo": school = "evocation"; break
            case "ill": school = "illusion"; break
            case "nec": school = "necromancy"; break
            case "trs": school = "transmutation"; break
            default: school = false
        }
        return (school)
    }
    /***************************************************************************************************
     * Return a random supported color for spell rune
     ***************************************************************************************************/
    static getRandomRuneColor() {
        let allowedColorArray = ["blue", "green", "pink", "purple", "red", "yellow"];
        // Returns a random integer from 0 to (allowedColorArray.length):
        let index = Math.floor(Math.random() * (allowedColorArray.length));
        return (allowedColorArray[index])
    }
    /***************************************************************************************************
    * Run a 3 part spell rune VFX on indicated token  with indicated rune, Color, scale, and opacity
    * may be optionally specified.
    * 
    * If called with an array of target tokens, it will recursively apply the VFX to each token 
    * 
    * Typical calls: 
    *  jez.runRuneVFX(tToken, jez.getSpellSchool(aItem))
    *  jez.runRuneVFX(args[0].targets, jez.getSpellSchool(aItem), jez.getRandomRuneColor())
    ***************************************************************************************************/
    static async runRuneVFX(target, school, color, scale, opacity) {
        school = school || "enchantment"            // default school is enchantment \_(ツ)_/
        color = color || jez.getRandomRuneColor()   // If color not provided get a random one
        scale = scale || 1.2                        // If scale not provided use 1.0
        opacity = opacity || 1.0                    // If opacity not provided use 1.0
        // jez.log("runRuneVFX(target, school, color, scale, opacity)","target",target,"school",school,"scale",scale,"opacity",opacity)
        if (Array.isArray(target)) {                // If function called with array, do recursive calls
            for (let i = 0; i < target.length; i++) jez.runRuneVFX(target[i], school, color, scale, opacity);
            return (true)                           // Stop this invocation after recursive calls
        }
        //-----------------------------------------------------------------------------------------------
        // Build names of video files needed
        // 
        const INTRO = `jb2a.magic_signs.rune.${school}.intro.${color}`
        const BODY = `jb2a.magic_signs.rune.${school}.loop.${color}`
        const OUTRO = `jb2a.magic_signs.rune.${school}.outro.${color}`
        //-----------------------------------------------------------------------------------------------
        // Change TokenDocument5e to Token5e
        // 
        //let t1 = {}
        //if (token1.constructor.name === "TokenDocument5e") t1 = token1._object
        //else t1 = token1
        //-----------------------------------------------------------------------------------------------
        // Play the VFX
        // 
        new Sequence()
            .effect()
            .file(INTRO)
            .atLocation(target)
            .scaleToObject(scale)
            .opacity(opacity)
            .waitUntilFinished(-500)
            .effect()
            .file(BODY)
            .atLocation(target)
            .scaleToObject(scale)
            .opacity(opacity)
            .duration(3000)
            .waitUntilFinished(-500)
            .effect()
            .file(OUTRO)
            .atLocation(target)
            .scaleToObject(scale)
            .opacity(opacity)
            .play();
    }
    /***************************************************************************************************
     * Move the movingToken up to the number of spaces specified as move away from the amchorToken if 
     * move is a positive value, toward if negative, after a delay in milliseconds
     ***************************************************************************************************/
    static async moveToken(anchorToken, movingToken, move, delay) {
        const FUNCNAME = "moveToken(anchorToken, movingToken, move)";
        let moveArray = [-3, -2, -1, 0, 1, 2, 3]
        const GRID_UNIT = canvas.scene.data.grid;
        let distBetweenTokens = jez.getDistance5e(anchorToken, movingToken);
        delay = delay || 10
        //----------------------------------------------------------------------------------------------
        // Store the X & Y coordinates of the two tokens
        // 
        const X = movingToken.center.x;                                 // Nab the X coord for target token
        const Y = movingToken.center.y;                                 // Nab the Y coord for target token
        //----------------------------------------------------------------------------------------------
        // Adjust move distance if necessary because tokens are already too close.
        // 
        if (distBetweenTokens <= 5) return (true)                   // Don't do anything if adjacent
        if (move === -3 && distBetweenTokens < 20) move = -2        // 4 spaces apart, can move 3
        if (move === -2 && distBetweenTokens < 15) move = -1        // 3 spaces apart, can move 2
        if (move === -1 && distBetweenTokens < 10) move = 0        // 2 spaces apart, can move 1
        if (move === 0) return (true)                               // Move = 0 is the trivial case
        //----------------------------------------------------------------------------------------------
        // Validity check on move
        // 
        if (!moveArray.includes(move)) {
            let msg = `Move distance requested, ${move} not supported by ${FUNCNAME}`;
            ui.notifications.error(msg);
            return (false);
        }
        let squareCorner = moveSpaces(move)
        await jez.wait(delay)
        await movingToken.document.update(squareCorner)
        return (true)
        //----------------------------------------------------------------------------------------------
        // Count of spaces to move 1, 2 or 3
        //----------------------------------------------------------------------------------------------
        function moveSpaces(count) {
            let dist = [];
            let minDist = 99999999999;
            let maxDist = 0;
            let minIdx = 0;
            let maxIdx = 0;
            let destSqrArray = buildSquareArray(Math.abs(count));

            for (let i = 1; i < destSqrArray.length; i++) {
                dist[i] = canvas.grid.measureDistance(destSqrArray[i], anchorToken.center);
                if (dist[i] < minDist) { minDist = dist[i]; minIdx = i; }
                if (dist[i] > maxDist) { maxDist = dist[i]; maxIdx = i; }
            }
            let index = minIdx                 // Assume pull, pick closest space
            if (count > 0) index = maxIdx       // Change to furthest if pushing
            let fudge = GRID_UNIT / 2;
            if (movingToken.data.width > 1)
                fudge = GRID_UNIT / 2 * movingToken.data.width;
            let squareCorner = {};
            squareCorner.x = destSqrArray[index].x - fudge;
            squareCorner.y = destSqrArray[index].y - fudge;
            return squareCorner;
        }
        function buildSquareArray(size) {
            let destSqrArray = [];     // destination Square array
            if (size === 0) return destSqrArray;
            //----------------------------------------------------------------------------------------------
            // Size = 1 is a one space move where 8 surrounding spaces will be considered.
            // The spaces considered are as shown in this "nifty" character graphics "drawing." 
            // 
            //       +---+---+---+
            //       | 1 | 2 | 3 |
            //       +---+---+---+
            //       | 4 | 5 | 6 |
            //       +---+---+---+
            //       | 7 | 8 | 9 |
            //       +---+---+---+
            //----------------------------------------------------------------------------------------------
            if (size === 1) {
                for (let i = 1; i < 10; i++) destSqrArray[i] = {};
                destSqrArray[1].y = destSqrArray[2].y = destSqrArray[3].y = Y - GRID_UNIT;
                destSqrArray[4].y = destSqrArray[5].y = destSqrArray[6].y = Y;
                destSqrArray[7].y = destSqrArray[8].y = destSqrArray[9].y = Y + GRID_UNIT;
                destSqrArray[1].x = destSqrArray[4].x = destSqrArray[7].x = X - GRID_UNIT;
                destSqrArray[2].x = destSqrArray[5].x = destSqrArray[8].x = X;
                destSqrArray[3].x = destSqrArray[6].x = destSqrArray[9].x = X + GRID_UNIT;
                return destSqrArray;
            }
            //----------------------------------------------------------------------------------------------
            // Sie = 2 is a two space move where 12 spaces may be solution.
            // The spaces considered are as shown in this "nifty" character graphics "drawing."
            //
            //            +----+----+----+
            //            |  1 |  2 |  3 |    
            //       +----+----+----+----+----+
            //       | 12 |    |    |    |  4 | 
            //       +----+----+----+----+----+
            //       | 11 |    | xx |    |  5 |
            //       +----+----+----+----+----+
            //       | 10 |    |    |    |  6 |
            //       +----+----+----+----+----+
            //            |  9 |  8 |  7 |  
            //            +----+----+----+
            //----------------------------------------------------------------------------------------------
            if (size === 2) {
                for (let i = 1; i <= 12; i++) destSqrArray[i] = {};
                destSqrArray[1].y = destSqrArray[2].y = destSqrArray[3].y = Y - 2 * GRID_UNIT;
                destSqrArray[4].y = destSqrArray[12].y = Y - GRID_UNIT;
                destSqrArray[5].y = destSqrArray[11].y = Y;
                destSqrArray[6].y = destSqrArray[10].y = Y + GRID_UNIT;
                destSqrArray[7].y = destSqrArray[8].y = destSqrArray[9].y = Y + 2 * GRID_UNIT;
                destSqrArray[10].x = destSqrArray[11].x = destSqrArray[12].x = X - 2 * GRID_UNIT;
                destSqrArray[1].x = destSqrArray[9].x = X - GRID_UNIT;
                destSqrArray[2].x = destSqrArray[8].x = X;
                destSqrArray[3].x = destSqrArray[7].x = X + GRID_UNIT;
                destSqrArray[4].x = destSqrArray[5].x = destSqrArray[6].x = X + 2 * GRID_UNIT;
                return destSqrArray;
            }
            //----------------------------------------------------------------------------------------------
            // Sie = 3 is a three space move where 16 spaces may be the solution.
            // The spaces considered are as shown in this "nifty" character graphics "drawing."
            // 
            //                 +----+----+----+
            //                 |  1 |  2 |  3 | 
            //            +----+----+----+----+----+
            //            |  4 |    |    |    |  5 | 
            //       +----+----+----+----+----+----+----+
            //       |  6 |    |    |    |    |    |  7 | 
            //       +----+----+----+----+----+----+----+
            //       |  8 |    |    | XX |    |    |  9 | 
            //       +----+----+----+----+----+----+----+
            //       | 10 |    |    |    |    |    | 11 | 
            //       +----+----+----+----+----+----+----+
            //            | 12 |    |    |    | 13 |    
            //            +----+----+----+----+----+
            //                 | 14 | 15 | 16 |   
            //                 +----+----+----+
            //----------------------------------------------------------------------------------------------
            if (size === 3) {
                for (let i = 1; i <= 16; i++) destSqrArray[i] = {};
                destSqrArray[1].y = destSqrArray[2].y = destSqrArray[3].y = Y - 3 * GRID_UNIT;
                destSqrArray[4].y = destSqrArray[5].y = Y - 2 * GRID_UNIT;
                destSqrArray[6].y = destSqrArray[7].y = Y - 1 * GRID_UNIT;
                destSqrArray[8].y = destSqrArray[9].y = Y - 0 * GRID_UNIT;
                destSqrArray[10].y = destSqrArray[11].y = Y + 1 * GRID_UNIT;
                destSqrArray[12].y = destSqrArray[13].y = Y + 2 * GRID_UNIT;
                destSqrArray[14].y = destSqrArray[15].y = destSqrArray[16].y = Y + 3 * GRID_UNIT;

                destSqrArray[6].x = destSqrArray[8].x = destSqrArray[10].x = X - 3 * GRID_UNIT;
                destSqrArray[4].x = destSqrArray[12].x = X - 2 * GRID_UNIT;
                destSqrArray[1].x = destSqrArray[14].x = X - 1 * GRID_UNIT;
                destSqrArray[2].x = destSqrArray[15].x = X - 0 * GRID_UNIT;
                destSqrArray[3].x = destSqrArray[16].x = X + 1 * GRID_UNIT;
                destSqrArray[5].x = destSqrArray[13].x = X + 2 * GRID_UNIT;
                destSqrArray[7].x = destSqrArray[9].x = destSqrArray[11].x = X + 3 * GRID_UNIT;
                return destSqrArray;
            }
        }
    }
    /***************************************************************************************************
     * getRace
     *
     * Return the race of the passed Actor5e, Token5e, or TokenDocument5e.  The value will be a lowercase
     * string, which may be empty.  It is taken from a user input field, so garbage may be present.  
     * 
     * If passed a parm not of a supported type, return FALSE
     ***************************************************************************************************/
    static getRace(entity) {
        let objType = entity.constructor.name
        let subject = null
        if (objType === "Actor5e")          // perhaps entity is actor5e?  
            subject = entity                // point subject at the actor5e
        if (objType === "Token5e")          // maybe it is a Token5e?
            subject = entity.actor          // point subject at the actor5e
        if (objType === "TokenDocument5e")   // Maybe it is a TokenDocument5e
            subject = entity._actor         // point subject at the actor5e
        if (subject === null) return (false) // garbage in, return false
        // jez.log(`------ Get Race Call ------`, `Object '${objType}'`, entity, `Subject ${subject.name}`, 
        //subject, `subject.data.type`, subject.data.type)
        let isNPC, targetType;
        if (subject.data.type === "npc") isNPC = true; else isNPC = false;
        if (isNPC) targetType = subject.data.data.details.type.value.toLowerCase()
        else targetType = subject.data.data.details.race.toLowerCase()
        return (targetType)
    }

    /***************************************************************************************************
     * Following are my "item" handling functions.  All of them intended to deal with items on a token's
     * actor.
     * 
     * - itemAddToActor
     * - itemDeleteFromActor
     * - itemFindOnActor
     * - itemUpdateOnActor
     ***************************************************************************************************/

    /***************************************************************************************************
     * Copy the item named as "ItemName" from the items directory to the token named as token5e.  Since 
     * we control the items directory, going to assume the wisdom to make ItemName unique is exercised.
     ***************************************************************************************************/
    static async itemAddToActor(token5e, ItemName) {
        // jez.log(`Copy ${ItemName} from the Items directory to ${token5e.name}`)
        let itemObj = game.items.getName(ItemName)
        if (!itemObj) {
            let msg = `Failed to find ${ItemName} in the Items Directory`
            ui.notifications.error(msg);
            // postResults(msg)
            return (false)
        }
        return (token5e.actor.createEmbeddedDocuments("Item", [itemObj.data]))
    }
    /***************************************************************************************************
    * Delete specified item (string matching name) from specified token5e.  Return true on success, 
    * false on failure. If a third parameter "itemType" is passed limit the search to items of that
    * type.
    * 
    * This function is similar to jez.deleteItems, but only deletes one copy of the item.
    ***************************************************************************************************/
    static async itemDeleteFromActor(token5e, itemName, itemType) {
        // jez.log("itemDeleteFromActor(token5e, itemName, itemType)", "token5e", token5e, "itemName", itemName, "itemType", itemType)
        let getItem = await jez.itemFindOnActor(token5e, itemName, itemType);
        // jez.log("getItem", getItem)
        if (!getItem) return (false);
        return (await getItem.delete());
    }
    /***************************************************************************************************
     * Search the specified Token5e's actor for the named item.  Return false if not found, return
     * the item if found.  If a third parameter "itemType" is passed limit the search to items of that
     * type.
     *
     * Some known itemTypes: backpack, class, consumable, equipment, feat, loot, spell, tool, weapon
     ***************************************************************************************************/
    static async itemFindOnActor(token5e, itemName, itemType) {
        // jez.log("itemFindOnActor(token5e, itemName, itemType)", "token5e", token5e, "itemName", itemName, "itemType", itemType)
        let foundItem = false
        if (!itemType) foundItem = token5e.actor.items.find(i => i.name === itemName);
        else foundItem = token5e.actor.items.find(i => i.name === itemName && i.type === itemType);
        // jez.log("foundItem", foundItem)
        return (foundItem);
    }
    /***************************************************************************************************
     * For the item named as itemName, optionally of the specified itemType on the token5e update the 
     * item as specified in the itemUpdate object.  
     * 
     * Special case, if data.description.value is not specified in the update object, then this function
     * will strip out anything set off in bold surrounded by double percent symbols. 
     ***************************************************************************************************/
    static async itemUpdateOnActor(token5e, itemName, itemUpdate, itemType) {
        //----------------------------------------------------------------------------------------------
        // jez.log(`Searching for ${itemName} on ${token5e.name}`)
        //let aActorItem = token5e.actor.data.items.getName(itemName)
        let aActorItem = await jez.itemFindOnActor(token5e, itemName, itemType)
        if (!aActorItem) {
            let msg = `Failed to find ${itemName} on ${token5e.name}`
            ui.notifications.error(msg);
            // postResults(msg)
            return (false)
        }
        //----------------------------------------------------------------------------------------------
        // If the passed update, doesn't change the value of the decription, then pull out the comments.
        //
        if (!itemUpdate?.data?.description?.value) {
            //-----------------------------------------------------------------------------------------------
            // Remove the don't change this message assumed to be embedded in the item description.  It 
            // should be of the form: <p><strong>%%.*%%</strong></p> optionally followed by white space
            //
            const searchString = `<p><strong>.*%%.*%%</strong></p>[\s\n\r]*`;
            const regExp = new RegExp(searchString, "g");
            const replaceString = ``;
            let content = await duplicate(aActorItem.data.data.description.value);
            content = await content.replace(regExp, replaceString);
            // jez.log('content', content)
            itemUpdate.data = { 'description.value': content } // Drop in altered description
            // jez.log("itemUpdate", itemUpdate)
        }
        return (await aActorItem.update(itemUpdate))
    }

    /**************************************************************************************************************
     * Add a macro execute line calling the macro "Remove_Paired_Effect" which must exist in the macro folder to 
     * named effect on the pair of tokens supplied.  
     * 
     * Note: This operates on effect by name which can result in unexpected results if multiple effects on a an
     * actor have the same name.  Not generally an issue, but it might be.
     * 
     * subject1 & subject2 are types supported by jez.getActor5eDataObj (actor5e, token5e, token5e.id, actor5e.id)
     * effectName1 & effectName2 are strings that name effects on their respective token actors.
     **************************************************************************************************************/
    static async pairEffects(subject1, effectName1, subject2, effectName2) {
        //---------------------------------------------------------------------------------------------------------
        // Convert subject1 and subject2 into actor objects, throw an error and return if conversion fails
        //
        let actor1 = jez.getActor5eDataObj(subject1)
        if (!actor1) return (ui.notfications.error("First subject not a token, actor, tokenId or actorId"))
        let actor2 = jez.getActor5eDataObj(subject2)
        if (!actor2) return (ui.notfications.error("Second subject not a token, actor, tokenId or actorId"))
        //---------------------------------------------------------------------------------------------------------
        // Make sure the macro that will be called later exists.  Throw an error and return if not
        //
        let pairingMacro = game.macros.find(i => i.name === "Remove_Paired_Effect");
        if (!pairingMacro) return ui.notifications.error("REQUIRED: Remove_Paired_Effect macro is missing.");
        //---------------------------------------------------------------------------------------------------------
        // Grab the effect data from the first token
        //
        let effectData1 = await actor1.effects.find(i => i.data.label === effectName1);
        if (!effectData1) {
            msg = `Sadly "${effectName1}" effect not found on ${actor1.name}.  Effects not paired.`
            // jez.log(msg)
            ui.notifications.warn(msg)
            return (false)
        }
        //---------------------------------------------------------------------------------------------------------
        // Grab the effect data from the second token
        //
        let effectData2 = await actor2.effects.find(i => i.data.label === effectName2);
        if (!effectData2) {
            msg = `Sadly "${effectName2}" effect not found on ${actor2.name}.  Effects not paired.`
            // jez.log(msg)
            ui.notifications.warn(msg)
            return (false)
        }
        //---------------------------------------------------------------------------------------------------------
        // Add the actual pairings
        //
        await addPairing(effectData2, actor1, effectData1)
        await addPairing(effectData1, actor2, effectData2)
        //---------------------------------------------------------------------------------------------------------
        // Define a function to do the actual pairing
        //
        async function addPairing(effectChanged, tokenPaired, effectPaired) {
            let value = `Remove_Paired_Effect ${tokenPaired.id} ${effectPaired.id}`
            effectChanged.data.changes.push({ key: `macro.execute`, mode: jez.CUSTOM, value: value, priority: 20 })
            return (await effectChanged.update({ changes: effectChanged.data.changes }))
        }
        return (true)
    }
    /*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
     * Function to return the Actor5e data associated with the passed parameter.
     *
     * Parameters
     *  - subject: actor, token, or token Id to be searched
     *********1*********2*********3*********4*********5*********6*********7*********8*********9**********/
    static getActor5eDataObj(subject) {
        let mes = ""
        let actor5e = null
        const FUNCNAME = "jez.getActor5eDataObj(subject)"
        //(`${FUNCNAME} received`, subject)
        //----------------------------------------------------------------------------------------------
        // Validate the subject parameter, stashing it into "actor5e" variable, returning false is bad
        //
        if (typeof (subject) === "object") {                   // Hopefully we have a Token5e or Actor5e
            if (subject.constructor.name === "Token5e") {
                actor5e = subject.actor
                return (actor5e)
            }
            else {
                if (subject.constructor.name === "Actor5e") {
                    actor5e = subject
                    return (actor5e)
                }
                else {
                    mes = `Object passed to ${FUNCNAME} is type "${typeof (subject)}" must be Token5e or Actor5e`
                    ui.notifications.error(mes)
                    // jez.log(mes)
                    return (false)
                }
            }
        }
        else {                  // subject is not an object maybe it is 16 char string? 
            // jez.log("subject is not an object maybe it is 16 char string?", subject)
            if ((typeof (subject) === "string") && (subject.length === 16)) {
                actor5e = jez.getTokenById(subject)?.actor// Maybe string is a token id?
                if (actor5e) return (actor5e)             // Subject is a token ID 
                actor5e = canvas.tokens.placeables.find(ef => ef.data.actorId === subject).actor
                if (actor5e) return (actor5e)             // Subject is an actorID embedded in a scene token 
                actor5e = game.actors.get(subject)        // Maybe string is an actor id?
                if (actor5e) return (actor5e)             // Subject is an actor ID 
                mes = `Subject parm passed to ${FUNCNAME} looks like an id but does not map to a token or actor: ${subject}`
                ui.notifications.error(mes)
                // jez.log(mes)
                return (false)
            }
            else {                                      // Oh fudge, subject is something unrecognized
                mes = `Subject parm passed to ${FUNCNAME} is not a Token5e, Actor5e, Token.id, or Actor.id: ${subject}`
                ui.notifications.error(mes)
                // jez.log(mes)
                return (false)
            }
        }
    }
    /*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
     * Function to return the Effect data object identified by arguments
     *
     * Parameters
     *  - effect: either a string naming the effect, an id or a uuid 
     *    e.g. 52 character string: Actor.i9vqeZXzvIcdZ3BU.ActiveEffect.DmvGS7OsCz3HoggP
     *  - subject: identifies the actor with effect in question, supported by getActor5eDataObj
     *    i.e. Objects: actor5e, token5e; 16 character Strings: token5e.id, actor5e.id
     *    this parameter is required if given a named effect or an id, otherwise not used 
     *********1*********2*********3*********4*********5*********6*********7*********8*********9**********/
    static async getEffectDataObj(effect, subject) {
        let mes = ""
        let effectUuid = ""
        const FUNCNAME = "getEffectDataObj(effect, subject)"
        // jez.log(`-------------- Starting --- ${FUNCNAME} -----------------`);
        // jez.log(`PARAMATERS`, "effect", effect, "subject", subject )
        //----------------------------------------------------------------------------------------------
        // If we were not given a "subject" parameter, the effect must be a UUID, validate this.
        //
        if (!subject) {
            if ((typeof (effect) === "string") && (effect.length === 52)) {
                // tokenize the effect and validate
                let tokens = effect.split(".")
                if (tokens.length != 4) {
                    mes = `BAD NEWS: ${FUNCNAME}'s effect tokenized to ${tokens.length} elements`
                    ui.notifications.error(mes); jez.log(mes); return (false)
                }
                if (tokens[1].length != 16) {
                    mes = `BAD NEWS: Second token of ${FUNCNAME}'s effect was invalid length (tokens[1].length)`
                    ui.notifications.error(mes); jez.log(mes); return (false)
                }
                if (tokens[2] != "ActiveEffect") {
                    mes = `BAD NEWS: Third token of ${FUNCNAME}'s effect was not 'ActiveEffect'`
                    ui.notifications.error(mes); jez.log(mes); return (false)
                }
                if (tokens[3].length != 16) {
                    mes = `BAD NEWS: Forth token of ${FUNCNAME}'s effect was invalid length (tokens[1].length)`
                    ui.notifications.error(mes); jez.log(mes); return (false)
                }
                effectUuid = effect
                // jez.log(`effectUuid directly provided`, effectUuid)
            }
            else {
                mes = `BAD NEWS: effect is not a valid UUID and no subject provided.`
                ui.notifications.error(mes); jez.log(mes); return (false)
            }
        }
        else {  // Must have been passed a subject, so see if parameters are valid
            //------------------------------------------------------------------------------------------
            // Obtain an Actor5e data object from subject
            //
            // jez.log(`Calling jez.getActor5eDataObj(subject) with`, subject)
            let actor5e = jez.getActor5eDataObj(subject)
            if (!actor5e) {
                mes = `BAD NEWS: actor data object not found for subject parm in ${FUNCNAME}`
                ui.notifications.error(mes); jez.log(mes); return (false)
            }
            //------------------------------------------------------------------------------------------
            // effect needs to be an id (16 character string) or a string providing name of effect
            //
            if (typeof (effect) != "string") {
                mes = `BAD NEWS: Subject parameter of ${FUNCNAME}'s effect needs to be a string, is a ${typeof (effect)}`
                ui.notifications.error(mes); jez.log(mes); return (false)
            }
            //------------------------------------------------------------------------------------------
            // Assemble a UUID (which may have a name string embedded in place of an actual id)
            //
            effectUuid = `Actor.${actor5e.id}.ActiveEffect.${effect}`
            // jez.log(`effectUuid from data pair`, effectUuid)
        }
        //----------------------------------------------------------------------------------------------
        // Now that things are validated, fetch the actor's data
        //
        // jez.log(`effectUuid`, effectUuid)
        let tokens = effectUuid.split(".")
        const ACTOR_ID = tokens[1]
        let actor5e = jez.getActor5eDataObj(ACTOR_ID)
        if (!actor5e) {
            mes = `BAD NEWS: ${FUNCNAME} could not find actor from ID ${ACTOR_ID}`
            ui.notifications.error(mes); jez.log(mes); return (false)
        }
        // jez.log(`Actor5e ${actor5e.name}`, actor5e)
        //----------------------------------------------------------------------------------------------
        // 
        //
        // jez.log(`Seeking effect "${tokens[3]}" within`, actor5e.effects)
        let effectData = await actor5e.effects.find(i => i.id === tokens[3] || i.data.label === tokens[3]);
        //let effectData = await actor5e.effects.find(i => i.name === tokens[3]);
        if (!effectData) {
            mes = `BAD NEWS: ${FUNCNAME} could not find "${tokens[3]}" on ${actor5e.name}`
            ui.notifications.error(mes); jez.log(mes); return (false)
        }
        // jez.log(`Effect ${effectData.name}`, effectData)
        // jez.log(`-------------- Finished --- ${FUNCNAME} -----------------`);
        return (effectData)
    }

    /*********1*********2*********3*********4*********5*********6*********7*********8*********9******
     * Accept a string and find the substring passed with it.  Return an object that has count and
     * an updated string with the substring replaced. 
     * 
     * Inputs
     * @param {String} string the string that will be searched and updated
     * @param {String} substring the substring that will be sought and replaced
     * @param {String} newSubstring the string that will replace occurrences of substring
     * @param {String} wrapChar a string, usually a special character that wraps the substring
     *
     * Return Object:
     * @typedef  {Object} replaceSubStr
     * @property {number} count  - Count of times substring appears in string
     * @property {string} string - Updated string with substring replaced by newSubstring
     *
     * Example Calls:
     * 1. testString = "rocket RoCKEt hi Rocket This is a roc ket. ROCKET's engine Rocketeer Sprocket"
     *    result = replaceSubString(testString, "ROCKET", "%TOKENNAME%")
     *    console.log(result.count, result.string)
     *    ==> 4 "%TOKENNAME% %TOKENNAME% hi %TOKENNAME% This is a roc ket. %TOKENNAME%'s engine Rocketeer Sprocket"
     *
     * 2. testString = "rocket RoCKEt hi Rocket This is a roc ket. ROCKET's engine Rocketeer Sprocket"
     *    result = replaceSubString(testString, "ROCKET", "%TOKENNAME%").string
     *    console.log(result)
     *    ==> %TOKENNAME% %TOKENNAME% hi %TOKENNAME% This is a roc ket. %TOKENNAME%'s engine Rocketeer Sprocket
     *********1*********2*********3*********4*********5*********6*********7*********8*********9*****/
    static replaceSubString(string, substring, newSubstring, wrapChar = "") {
        // jez.log("replaceSubString(string, substring, newSubstring)","string",string,"substring",substring,"newSubstring",newSubstring,"wrapChar",wrapChar)
        let returnObj = {}
        let re = new RegExp(`${wrapChar}\\b${substring}\\b${wrapChar}`, 'gi');
        returnObj.count = (string.match(re, newSubstring) || []).length
        returnObj.string = string.replace(re, newSubstring)
        return (returnObj)
    }
    /*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
     * Pop the passed string (message) onto the console and as ui notification and return false.
     * 
     * This function can accept one or two arguments
     * message: required string that will be used as the error message
     * badness: optional severity indicator.  It can be an integer (1, 2, or 3) or a string that begins 
     *          with a i, w, or e (technically, the code is much more permissive but this is intent.)
     *********1*********2*********3*********4*********5*********6*********7*********8*********9*********/
    static badNews(message, badness = 2) {
        if (typeof message !== "string") {
            let msg = `The message paramater passed to badNews must be a string.  Bad, bad, programmer.`
            console.log(msg, message)
            ui.notifications.error(`ERROR: ${msg}`)
            return (false)
        }
        if (typeof badness === "string") {
            switch (badness.toLowerCase().at(0)) {
                case "i": badness = 1; break
                case "w": badness = 2; break
                default: badness = 3
            }
        }
        console.log(`BadNews | ${message}`)
        if (badness < 2) ui.notifications.info(`INFO: ${message}`)
        else if (badness === 2) ui.notifications.warn(`WARN: ${message}`)
        else ui.notifications.error(`ERROR: ${message}`)
        return (false)
    }
    /*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
     * Search the passed array for items of a given name and type. Return the number of matches
     * 
     * The passed array should be an array of Item5e objects that contain, at a minimum these fields:
     * @typedef  {Object} Item5e
     * @property {string} name  - Count of times substring appears in string
     * @property {string} type - Updated string with substring replaced by newSubstring
     * 
     * Typical Calls
     * =============
     * let matches = 0
     * let nameOfItem = "Longsword"
     * let typeOfItem = "weapon"
     * matches = itemMgmt_itemCount(game.items.contents, nameOfItem, typeOfItem)     // matches in sidebar
     * matches = itemMgmt_itemCount(tActor.items.contents, nameOfItem, typeOfItem)   // matches on actor
     * if (matches > 1) {
     *    msg = `Item for "${nameOfItem}" of type "${typeOfItem}" not unique in Item Directory.`
     *    console.log(msg)
     *    ui.notifications.warn(msg)
     *    return (false)
     * }
     *********1*********2*********3*********4*********5*********6*********7*********8*********9*********/
    static itemMgmt_itemCount(array, name, type) {
        // jez.log(array)
        let count = 0
        for (const ITEM of array) if ((ITEM.name === name) && (ITEM.type === type)) count++
        return (count)
    }

    /*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
     * jez.selectItemOnActor(...)
     * 
     * Series of 3 dialogs to select an Item from selected actor and then find all of the actors that 
     * have that item, building a data object that is passed to the nextFunction (passed in as a 
     * parameter).
     * 
     * Inputs
     * @arg {object} sToken - a Token5e data object representing the source token to be read
     * @arg {object} prompts - An object containing a number of strings, any of which may be omitted
     * @arg {function} nextFunction - Called at successful conclusion and passed selection object
     * 
     * NextFunction contents
     * @typedef  {Object} promptObj
     * @property {string} title1 - Dialog title for first pop-up dialog
     * @property {string} text1  - Dialog text for first pop-up dialog
     * @property {string} title2 - Dialog title for second pop-up dialog
     * @property {string} text2  - Dialog text for second pop-up dialog
     * @property {string} title3 - Dialog title for third pop-up dialog
     * @property {string} text3  - Dialog text for third pop-up dialog 
     * 
     * Default value for dialogs
     * Title1 = "What type of thing?"
     * Text1  = "Please, pick one from list below."
     * Title2 = "Which specific item should be acted upon?"
     * Text2  = `Pick one item from list of "${itemType}" item(s)`
     * Title3 = "Select Actor(s) to have their item acted upon."
     * Text3  = `Choose the actor(s) to have their ${itemSelected} of type ${itemType} acted upon.`
     * 
     * The nextFunction is called with a selObj that will contain the following
     * @typedef  {Object} selObj
     * @property {object} sToken - a Token5e data object representing the source token to be read
     * @property {array} actorsIdsToUpdate - array of actor IDs for the actor selected in dialogs
     * @property {string} itemSelected - string naming the item being acted upon
     * @property {type} itemType - string naming the type of object (e.g. spell, weapon) targeted
     * 
     * Execution can be aborted from each dialog by selecting cancel or the X button.  If that is the 
     * case a false if returned.
     *********1*********2*********3*********4*********5*********6*********7*********8*********9*********/
    static async selectItemOnActor(sToken, prompts, nextFunction) {
        let typesFound = []
        //--------------------------------------------------------------------------------------------
        // Set up our variables for this function
        //
        let sActor = sToken.actor
        //--------------------------------------------------------------------------------------------
        // Read through all of the targets items to find all of the types represented
        //
        for (let i = 0; i < sActor.items.contents.length; i++) {
            // jez.log(`${i} ${sActor.items.contents[i].data.type} ${sActor.items.contents[i].data.name}`)
            if (!typesFound.includes(sActor.items.contents[i].data.type))
                typesFound.push(sActor.items.contents[i].data.type);
        }
        // jez.log(`Found ${typesFound.length} types}`, typesFound.sort())
        //--------------------------------------------------------------------------------------------
        // Pop a dialog to select the type of thing to be operated on
        //
        const Q_TITLE = prompts.title1 ?? "What type of thing?";
        const Q_TEXT = prompts.text1 ?? "Please, pick one from list below.";
        if (typesFound.length > 9) await jez.pickFromListArray(Q_TITLE, Q_TEXT, typeCallBack, typesFound.sort());
        else await jez.pickRadioListArray(Q_TITLE, Q_TEXT, typeCallBack, typesFound.sort());
        /*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
         * typeCallBack
         *********1*********2*********3*********4*********5*********6*********7*********8*********9*********/
        async function typeCallBack(itemType) {
            const FUNCNAME = "typeCallBack(itemType)";
            // jez.log(`--- Starting --- ${MACRONAME} ${FUNCNAME} ---`,"itemType",itemType);
            let msg = `typeCallBack: Type "${itemType}" was selected in the dialog`;
            console.log(msg);
            let itemsFound = [];
            //--------------------------------------------------------------------------------------------
            // If cancel button was selected on the preceding dialog, null is returned.
            //
            if (itemType === null)
                return (false);
            //--------------------------------------------------------------------------------------------
            // If nothing was selected call preceding function and terminate this one
            //
            if (!itemType) {
                // jez.log("itemType",itemType)
                console.log("No selection passed to typeCallBack(itemType), trying again.");
                jez.selectItemOnActor(sToken, prompts, nextFunction);
                return (false);
            }
            //--------------------------------------------------------------------------------------------
            // Find all the item of type "itemType"
            //
            for (let i = 0; i < sActor.items.contents.length; i++) {
                // jez.log(`${i} ${sActor.items.contents[i].data.type} ${sActor.items.contents[i].data.name}`)
                if (sActor.items.contents[i].data.type === itemType)
                    itemsFound.push(sActor.items.contents[i].data.name);
            }
            // jez.log(`Found ${itemsFound.length} ${itemType}(s)`, itemsFound.sort())
            //--------------------------------------------------------------------------------------------
            // From the Items found, ask which item should trigger opening a sheet.
            //
            const Q_TITLE = prompts.title2 ?? "Which specific item should be acted upon?";
            const Q_TEXT = prompts.text2 ?? `Pick one item from list of "${itemType}" item(s)`;
            if (itemsFound.length > 9) await jez.pickFromListArray(Q_TITLE, Q_TEXT, itemCallBack, itemsFound.sort());
            else await jez.pickRadioListArray(Q_TITLE, Q_TEXT, itemCallBack, itemsFound.sort());
            // jez.log(`--- Finished --- ${MACRONAME} ${FUNCNAME} ---`);
            /*********1*********2*********3*********4*********5*********6*********7*********8*********9******
             * itemCallBack
             *********1*********2*********3*********4*********5*********6*********7*********8*********9*****/
            function itemCallBack(itemSelected) {
                let msg = `itemCallBack: Item named "${itemSelected}" was selected in the dialog`;
                console.log(msg);
                let actorFullWithItem = [];
                //--------------------------------------------------------------------------------------------
                // If cancel button was selected on the preceding dialog, null is returned ==> Terminate
                //
                if (itemSelected === null)
                    return (false);
                //--------------------------------------------------------------------------------------------
                // If nothing was selected call preceding function and terminate this one
                //
                if (!itemSelected) {
                    console.log("No selection passed to itemCallBack(itemSelected), trying again.");
                    typeCallBack(itemType);
                    return (false);
                }
                //--------------------------------------------------------------------------------------------
                // Search all actors in the actor directory for our item/type combos
                //
                let allActors = game.actors;
                for (let entity of allActors) {
                    let itemFound = entity.items.find(item => item.data.name === itemSelected && item.type === itemType);
                    if (itemFound)
                        actorFullWithItem.push(`${entity.name} (${entity.id})`);
                }
                //--------------------------------------------------------------------------------------------
                // From the Items found, ask which item should trigger opening a sheet.
                //
                const Q_TITLE = prompts.title3 ?? "Select Actor(s) to have their item acted upon.";
                const Q_TEXT = prompts.text3 ?? `Choose the actor(s) to have their ${itemSelected} of type ${itemType} acted upon.`;
                jez.pickCheckListArray(Q_TITLE, Q_TEXT, pickCheckCallBack, actorFullWithItem);
            // jez.log(`*** Ending pickCheckListArray ${MACRONAME}`);
            /*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
             * pickCheckCallBack
             *********1*********2*********3*********4*********5*********6*********7*********8*********9*********/
            /*async*/ function pickCheckCallBack(selection) {
                    let actorsIdsToUpdate = [];
                    let selectionString = "";
                    //--------------------------------------------------------------------------------------------
                    // If cancel button was selected on the preceding dialog, null is returned.
                    //
                    // jez.log("selection", selection)
                    if (selection === null) return (false);
                    //--------------------------------------------------------------------------------------------
                    // If nothing was selected (empty array), call preceding function and terminate this one
                    //
                    if (selection.length === 0) {
                        console.log("No selection passed to pickCheckCallBack(selection), trying again.");
                        itemCallBack(itemSelected); // itemSelected is a global that is passed to preceding func
                        return (false);
                    }
                    //--------------------------------------------------------------------------------------------
                    // Write function start with number selected to console.log
                    //
                    let msg = `pickCheckCallBack: ${selection.length} actor(s) selected in the dialog`;
                    console.log(msg);
                    //--------------------------------------------------------------------------------------------
                    // Build a string with <br> embedded between entries, other than last
                    //
                    for (let i = 0; i < selection.length; i++) {
                        if (selectionString)
                            selectionString += "<br>";
                        selectionString += selection[i];
                    }
                    //----------------------------------------------------------------------------------------------
                    // Build an array of the actor IDs that might be updated
                    // Selection lines are of this form: Lecherous Meat Bag, Medium (eYstNJefUUgrHk8Q)
                    //
                    // jez.log('selection', selection)
                    for (let i = 0; i < selection.length; i++) {
                        // jez.log(`${i + 1} ${selection[i]}`)
                        let actorArray = []; // Array for actors seperated by "(", there will be 2 or more
                        actorArray = selection[i].split("(");
                        let actorId = actorArray[actorArray.length - 1].slice(0, -1); // Chop off last character a ")"
                        actorsIdsToUpdate.push(actorId); // Stash the actual actorId from the selection line
                    }
                    //----------------------------------------------------------------------------------------------
                    // Build object to be returned to calling function
                    //
                    // jez.log(`--- Loading Data ---`,"sToken",sToken,"actorsIdsToUpdate",actorsIdsToUpdate,"itemSelected",itemSelected,"itemType",itemType)
                    let selObj = {
                        sToken: sToken,
                        idArray: actorsIdsToUpdate,
                        itemName: itemSelected,
                        itemType: itemType
                    }
                    // jez.log(`--- Passing Data ---`,"selObj.sToken",selObj.sToken,"selObj.idArray",selObj.idArray,"selObj.itemName",selObj.itemName,"selObj.itemType",selObj.itemType)
                    nextFunction(selObj)    // Call teh nextFunction (passed to this function with our selection object
                }
            }
        }
    }

    /***************************************************************************************************
    * Function to play a VFX explosion at the specified location.  Built for summoning with warpgate
    * 
    * Template can be coordinates (e.g. {x: 875, y: 805}) or anything else accepted by sequencer
    * 
    * Supported colors: "Blue", "Green", "Orange", "Purple", "Yellow", "*"
    * 
    * @typedef  {Object} optionObj
    * @property {string} color - one of the supported colors
    * @property {number} opactity - real number defining opacity, defaults to 1.0
    * @property {number} scale - real number defining scale, defaults to 1.0
    ***************************************************************************************************/
    static async vfxPreSummonEffects(template, optionObj) {
        //-------------------------------------------------------------------------------------------------
        // Anticipated VFX files include
        // modules/jb2a_patreon/Library/Generic/Explosion/Explosion_01_Blue_400x400.webm
        // modules/jb2a_patreon/Library/Generic/Explosion/Explosion_01_Green_400x400.webm
        // modules/jb2a_patreon/Library/Generic/Explosion/Explosion_01_Orange_400x400.webm
        // modules/jb2a_patreon/Library/Generic/Explosion/Explosion_01_Purple_400x400.webm
        // modules/jb2a_patreon/Library/Generic/Explosion/Explosion_01_Yellow_400x400.webm
        //
        const colors = ["Blue", "Green", "Orange", "Purple", "Yellow", "*"];
        let color
        if (colors.includes(optionObj?.color)) color = optionObj?.color
        else color = "*"
        const SCALE = optionObj?.scale ?? 1.0
        const OPACITY = optionObj?.opacity ?? 1.0
        const VFX_FILE = `modules/jb2a_patreon/Library/Generic/Explosion/Explosion_*_${color}_400x400.webm`

        new Sequence()
            .effect()
            .file(VFX_FILE)
            .atLocation(template)
            .center()
            .scale(SCALE)
            .opacity(OPACITY)
            .play()
    }
    /***************************************************************************************************
     * Function to play a VFX smoke at the specified location.  Built for summoning with warpgate
     * 
     * Template can be coordinates (e.g. {x: 875, y: 805}) or anything else accepted by sequencer
     * 
     * Supported colors: "Blue", "Black", "Green", "Purple", "Grey", "*"
     * 
     * @typedef  {Object} optionObj
     * @property {string} color - one of the supported colors
     * @property {number} opactity - real number defining opacity, defaults to 1.0
     * @property {number} scale - real number defining scale, defaults to 1.0
   ***************************************************************************************************/
    static async vfxPostSummonEffects(template, optionObj) {
        //-------------------------------------------------------------------------------------------------
        // Anticipated VFX files include
        // modules/jb2a_patreon/Library/Generic/Smoke/SmokePuff01_01_Regular_Blue_400x400.webm
        // modules/jb2a_patreon/Library/Generic/Smoke/SmokePuff01_01_Dark_Black_400x400.webm
        // modules/jb2a_patreon/Library/Generic/Smoke/SmokePuff01_01_Dark_Green_400x400.webm
        // modules/jb2a_patreon/Library/Generic/Smoke/SmokePuff01_01_Dark_Purple_400x400.webm
        // modules/jb2a_patreon/Library/Generic/Smoke/SmokePuff01_01_Regular_Grey_400x400.webm
        //
        const colors = ["Blue", "Black", "Green", "Purple", "Grey", "*"];
        let color // = optionObj.color ?? "Green"
        if (colors.includes(optionObj?.color)) color = optionObj?.color
        else color = "*"
        const SCALE = optionObj?.scale ?? 1.0
        const OPACITY = optionObj?.opacity ?? 1.0
        //const VFX_FILE = `modules/jb2a_patreon/Library/Generic/Explosion/Explosion_*_${color}_400x400.webm`
        const VFX_FILE = `modules/jb2a_patreon/Library/Generic/Smoke/SmokePuff01_*_*_${color}_400x400.webm`

        new Sequence()
          .effect()
            .file(VFX_FILE)
            .atLocation(template)
            .center()
            .scale(SCALE)
            .opacity(OPACITY)
          .play()
    }

    /***************************************************************************************************
     * Modify an existing concentrating effect to contain a DAE effect line of the form:
     *   macro.execute custom <macroName> <argument[1]> <argument[2]> ...
     * 
     * macroName should be a string that names an existing macro to be called by DAE when the effect 
     * is removed with the arguments provided.
     * 
     * argArray should be an array of arguments to pass to macroName as a string with a single space
     * between each.
     ***************************************************************************************************/
    static async modConcentratingEffect(aToken, macroName, argArray) {
        let argValue = ""
        const EFFECT = "Concentrating"
        // Make sure the macro to be called exists
        if (!game.macros.getName(macroName)) return (jez.badNews(`Cannot locate ${macroName} macro.`))
        // Search the passed token to find the effect, return if it doesn't
        let effect = await aToken.actor.effects.find(i => i.data.label === EFFECT);
        if (!effect) return (jez.badNews(`Unable to find ${EFFECT} on ${aToken.name}`))
        // Build the value string from the argArray
        for (const element of argArray) argValue += `${element} `
        // Define the desired modification to concentartion effect. 
        effect.data.changes.push(
            { key: `macro.execute`, mode: jez.CUSTOM, value: `${macroName} ${argValue}`, priority: 20 }
        )
        // Apply the modification to existing effect
        await effect.update({ 'changes': effect.data.changes });
    }

    /***************************************************************************************************
     * Return a type string that differentiates object objects from array objects which are the same 
     * thing when looked at with the normal typeof function.
     * 
     * This uses the object prototype, which seemingly exists for all variables and a few add on bits
     * of magic to return the same type of string returned by typeof, but with a bit more precision.
     * 
     * Object.prototype.toString.call(fruits); // [object Array]
     * Object.prototype.toString.call(user); // [object Object]
     * 
     * This was derived from: https://attacomsian.com/blog/javascript-check-variable-is-object
     * 
     * Example results
     *   jez.typeOf("John")                  // string
     *   jez.typeOf("3.14")                  // number
     *   jez.typeOf("NaN")                   // number
     *   jez.typeOf("false")                 // boolean
     *   jez.typeOf("[1,2,3,4]")             // array
     *   jez.typeOf("{name:'John', age:34}") // object
     *   jez.typeOf("new Date()")            // date
     *   jez.typeOf("function () {}")        // function
     *   jez.typeOf("null")                  // null
     ***************************************************************************************************/
    static typeOf(arg) {
        return Object.prototype.toString.call(arg).split(" ")[1].slice(0, -1).toLowerCase()
    }

    /*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
     * Somewhat simple minded object comparison function based on one found online.
     * https://medium.com/geekculture/object-equality-in-javascript-2571f609386e
     *********1*********2*********3*********4*********5*********6*********7*********8*********9*********/
    static isEqual(obj1, obj2) {
        // jez.log("jez.isEqual(obj1, obj2)","obj1",obj1,"obj1 type",typeof(obj1),"obj2",obj2,"obj2 type",typeof(obj2))
        if (!obj1 && !obj2) {
            // jez.log("obj1 & obj2 are falsey, return true")
            return true
        } else if (!obj1 || !obj2) {
            // jez.log("one of obj1 & obj2 are falsey, return false")
            return false
        }
        // jez.log("continue")
        let obj1Type = jez.typeOf(obj1)
        let obj2Type = jez.typeOf(obj2)
        if (obj1Type != obj2Type) return false

        if (!(obj1Type === "object" || obj1Type === "array")) {
            // If either obj are neither object nor array  perform strict comparison
            return obj1 === obj2
        }
        var props1 = Object.getOwnPropertyNames(obj1);
        // jez.log("props1",props1)
        var props2 = Object.getOwnPropertyNames(obj2);
        // jez.log("props2",props2)

        if (props1.length != props2.length) {
            // jez.log("length mismatch, return false")
            return false;
        }
        for (var i = 0; i < props1.length; i++) {
            let val1 = obj1[props1[i]];
            let val2 = obj2[props1[i]];
            let isObjects = isObject(val1) && isObject(val2);
            if (((isObjects && !jez.isEqual(val1, val2)) || (!isObjects && val1 !== val2))
                && !(!val1 && !val2)) {
                // jez.log("Not sure what this case is, return false")
                return false;
            }   // jez.log("Alternative result, continue")
        }
        // jez.log("made it, return true")
        return true;

        function isObject(object) {
            // jez.log("==> object",object)
            return object != null && typeof object === 'object';
        }
    }

    /*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
     * Test to see if the received string links to a run as GM macro.  Return the macro or false.
     * 
     *********1*********2*********3*********4*********5*********6*********7*********8*********9*********/
    static getMacroRunAsGM(macroName) {
        if (typeof macroName !== "string") {
            let msg = `isMacroRunAsGM() received non-string paramater.  Bad, bad, programmer.`
            console.log(msg, macroName)
            ui.notifications.error(`ERROR: ${msg}`)
            return (false)
        }
        const ACTOR_UPDATE = game.macros?.getName(macroName);
        if (!ACTOR_UPDATE) return jez.badNews(`Cannot locate ${macroName} GM Macro`, "Error");
        if (!ACTOR_UPDATE.data.flags["advanced-macros"].runAsGM)
            return jez.badNews(`${macroName} -- Execute as GM box, needs to be checked.`, "Error");
        return (ACTOR_UPDATE)
    }

    /***************************************************************************************************
     * Test to see is the passed argument is a Token5e object. Return true it is; otherwise false
    ***************************************************************************************************/
    static isActor5e(obj) {
        if (obj?.constructor.name === "Actor5e") return (true)
        return (false)
    }
    /***************************************************************************************************
     * Test to see is the passed argument is a Token5e object. Return true it is; otherwise false
     ***************************************************************************************************/
    static isToken5e(obj) {
        if (obj?.constructor.name === "Token5e") return (true)
        return (false)
    }

} // END OF class jez
Object.freeze(jez);