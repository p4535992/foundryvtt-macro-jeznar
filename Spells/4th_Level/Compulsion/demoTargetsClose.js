
const MACRONAME = "demo_TargetsClose.0.1.js"
/*********1*********2*********3*********4*********5*********6*********7*********8*********9*********0
 * This macro is a demo / developement tool to find all tokens within 30 feet that have LoS to the 
 * caster and then pop a selection dialog to pick desired targets.
 * 
 * 07/25/22 0.1 Creation of Macro
 *********1*********2*********3*********4*********5*********6*********7*********8*********9*********/
const MACRO = MACRONAME.split(".")[0]       // Trim of the version number and extension
const TL = 5;                               // Trace Level for this macro
let msg = "";                               // Global message string
//---------------------------------------------------------------------------------------------------
if (TL > 1) jez.trace(`=== Starting === ${MACRONAME} ===`);
if (TL > 2) for (let i = 0; i < args.length; i++) jez.trace(`  args[${i}]`, args[i]);
const LAST_ARG = args[args.length - 1];
//---------------------------------------------------------------------------------------------------
// Set the value for the Active Token (aToken)
let aToken;
if (LAST_ARG.tokenId) aToken = canvas.tokens.get(LAST_ARG.tokenId);
else aToken = game.actors.get(LAST_ARG.tokenId);
let aActor = aToken.actor
//
// Set the value for the Active Item (aItem)
let aItem;
if (args[0]?.item) aItem = args[0]?.item;
else aItem = LAST_ARG.efData?.flags?.dae?.itemData;
//---------------------------------------------------------------------------------------------------
// Set Macro specific globals
//
const RANGE = 30
//---------------------------------------------------------------------------------------------------
// doIt!
//
if (args[0]?.tag === "OnUse") await pickTargets({ traceLvl: TL });          // Midi ItemMacro On Use
/***************************************************************************************************
 * Check for targets that can hear and are in range. Pop a dialog to pick actual targets
 ***************************************************************************************************/
async function pickTargets(optionObj = {}) {
    const FUNCNAME = "doIt()";
    const FNAME = FUNCNAME.split("(")[0]
    const TL = optionObj?.traceLvl ?? 0
    if (TL === 1) jez.trace(`--- Called --- ${FNAME} ---`);
    if (TL > 1) jez.trace(`--- Called --- ${FUNCNAME} ---`);
    let potTargs = []
    let potTargNames = []
    //-------------------------------------------------------------------------------------------------------
    canvas.tokens.placeables.forEach(token => {
        if (aToken.name === token.name) return; // Skip caster token 
        //---------------------------------------------------------------------------------------------------
        // Is the current token in range?
        //
        const DISTANCE = jez.getDistance5e(aToken, token)
        if (DISTANCE > RANGE) return            // Skip out of range token
        //---------------------------------------------------------------------------------------------------
        // Does the potentally afflicted have a clear LoS (actually hearing) to the originator?
        //
        let badLoS = canvas.walls.checkCollision(new Ray(aToken.center, token.center), { type: "sound", mode: "any" })
        if (badLoS) return                      // Skip token with blocked line of sound (LoS)
        //---------------------------------------------------------------------------------------------------
        // Does the potentally afflicted have the Deafened affect?
        //
        if (jezcon.hasCE("Deafened", token.actor.uuid, { traceLvl: 0 })) return   // Skip deafened tokens
        potTargs.push(token)                    // Add this token to potential targets array
        potTargNames.push(`${token.name} {${token.id}}`)
    });
    if (TL > 0) jez.trace(`${MACRO} ${FNAME} | potTargs`, potTargs)
    for (let i = 0; i < potTargs.length; i++)
        if (TL > 0) jez.trace(`${MACRO} ${FNAME} | ${i}) ${potTargNames[i]} is a potential victim.`)
    if (potTargs.length === 0) return jez.badNews(`No affectable targets in range`, "i")
    //-------------------------------------------------------------------------------------------------------
    // Build and pop dialog to pick targets
    //
    const Q_TITLE = `Targets for ${aToken.name}'s Spell?`
    const Q_TEXT = `Pick targets that ${aToken.name} wants to force to roll saves or be affected by Spell.`
    jez.pickCheckListArray(Q_TITLE, Q_TEXT, checkCallBack, potTargNames.sort());
    //-------------------------------------------------------------------------------------------------------
    // Call back for the dialog
    //
    async function checkCallBack(selection) {
        const FUNCNAME = "checkCallBack(selection)";
        const FNAME = FUNCNAME.split("(")[0]
        const TL = optionObj?.traceLvl ?? 0
        if (TL === 1) jez.trace(`--- Called --- ${FNAME} ---`);
        if (TL > 1) jez.trace(`--- Called --- ${FUNCNAME} ---`, "Selection", selection);
        //---------------------------------------------------------------------------------------------------
        // Handle a cancel or X button from previous dialog
        //
        msg = `pickCheckCallBack: ${selection.length} actor(s) selected in the dialog`
        if (TL > 3) jez.trace(msg)
        if (selection === null) return;     // Cancel button was selected on the preceding dialog
        if (selection.length === 0) {       // Nothing was selected
            if (TL > 0) jez.trace(`${MACRO} ${FNAME} | No selection passed to pickCheckCallBack(selection), trying again.`)
            itemCallBack(itemSelected)		// itemSelected is a global that is passed to preceding func
            return;
        }
        //--------------------------------------------------------------------------------------------
        // Build an array of Token5e objects representing the targets of this spell
        //
        let tObjs = []                                  // Target Objects array
        for (let i = 0; i < selection.length; i++) {
            const TOKEN_ARRAY = selection[i].split("{") // Split the selection of braces "{"
            if (TOKEN_ARRAY.length < 2) return jez.badNews(`${MACRO} ${FNAME} | Bad parse of ${selection[i]}`, "e")
            const TOKEN_ID = TOKEN_ARRAY[TOKEN_ARRAY.length - 1].slice(0, -1);  // Clip trailing }
            tObjs.push(canvas.tokens.placeables.find(ef => ef.id === TOKEN_ID)) // Add object to array
        }
        //---------------------------------------------------------------------------------------------
        // Proceed with the tokens that might be affected (need to roll saves)
        //
        const SAVE_TYPE = "wis"
        const SAVE_DC = aActor.data.data.attributes.spelldc;
        let failSaves = []  // Array to contain the tokens that failed their saving throws
        let madeSaves = []  // Array to contain the tokens that made their saving throws
        let madeNames = ""
        let failNames = ""
        for (let i = 0; i < tObjs.length; i++) {
            console.log(tObjs[i].name)
            let save = (await tObjs[i].actor.rollAbilitySave(SAVE_TYPE, { chatMessage: false, fastforward: true }));
            if (save.total < SAVE_DC) {
                if (TL > 2) jez.trace(`${MACRO} ${FNAME} | ${tObjs[i].name} failed: ${SAVE_TYPE}${save.total} vs ${SAVE_DC}`)
                failSaves.push(tObjs[i])
                failNames += `<b>${tObjs[i].name}</b>: ${save.total} (${save._formula})<br>`
            } else {
                if (TL > 2) jez.trace(`${MACRO} ${FNAME} | ${tObjs[i].name} saved: ${SAVE_TYPE}${save.total} vs ${SAVE_DC}`)
                madeSaves.push(tObjs[i])
                madeNames += `<b>${tObjs[i].name}</b>: ${save.total} (${save._formula})<br>`
            }
        }
        if (TL > 3) jez.trace(`${FNAME} | Failed Saves ===>`, failSaves)
        //---------------------------------------------------------------------------------------------
        // Apply our overTime (oTv: overTimeValue) effect to afflicted tokens
        //
        let effectData = game.dfreds.effectInterface.findEffectByName("Compulsion").convertToObject();
        if (TL > 3) jez.trace(`${FNAME} | effectData >`, effectData)
        let oTV = `turn=end, saveAbility=${SAVE_TYPE}, saveDC=${SAVE_DC},label="Save vs Compulsion"` 
        effectData.changes.push({ key: `flags.midi-qol.OverTime`, mode: jez.OVERRIDE, value: oTV, priority: 20 })
        if (TL > 3) jez.trace(`${FNAME} | updated ===>`, effectData)
        for (let i = 0; i < failSaves.length; i++) {
            if (TL > 2) jez.trace(`${FNAME} | Apply affect to ${failSaves[i].name}`)
            game.dfreds.effectInterface.addEffectWith({ effectData: effectData, uuid: failSaves[i].actor.uuid, origin: aItem.uuid });
        }
        //---------------------------------------------------------------------------------------------
        // Craft results message and post it.
        //
        let chatMessage = await game.messages.get(args[args.length - 1].itemCardId);
        await jez.wait(100)
        if (madeNames) {
            msg = `<b><u>Successful ${SAVE_TYPE.toUpperCase()} Save</u></b> vs DC${SAVE_DC}<br>${madeNames}`
            await jez.wait(100)
            jez.addMessage(chatMessage, { color: "darkgreen", fSize: 14, msg: msg, tag: "damage" })
        }
        if (failNames) {
            msg = `<b><u>Failed ${SAVE_TYPE.toUpperCase()} Save</u></b> vs DC${SAVE_DC}<br>${failNames}`
            await jez.wait(100)
            jez.addMessage(chatMessage, { color: "darkred", fSize: 14, msg: msg, tag: "damage" })
        }
    }
}

