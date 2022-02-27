# Cantrips
This repository will contain my automated Cantrips as I create new or update existing (there are many) that currently reside only in my game data (which is regularly backed up) I'll add them here.

Spells will have notes on elemnts that I think are interesting.  In some cases differences from RAW, notes on how to use the spell in game, or coding notes.

* [Agonizing Blast](#agonizing-blast)
* [Druid Craft](#druid-craft)
* [Eldritch Blast](#eldritch-blast)
* [Light](#light)
* [Mage Hand](#mage-hand)
* [Prestidigitation](#prestidigitation)

[*Back to List of All Spells*](../README.md)

## Spell Notes

### Agonizing Blast

This spell is *very* similar to [eldritch blast](#eldritch-blast).  The differences are adding the casters spell modifier to the damage roll and a different, darker, set of animations.

![Agonizing Blast](Agonizing_Blast/Agonizing_Blast.gif)

[*Back to Cantrips List*](#cantrips)

---

### Druid Craft

This macro simply plays a VFX of a D12 over the casting token and spits out some text very briefly describing the spell.

![Druid_Craft.gif](Druid_Craft/Druid_Craft.gif)

[*Back to Cantrips List*](#cantrips)

---

### Eldritch Blast

Most of this spell is implemented by the configuratinn on the **Details** page. A screen shot of that configuration is included in the spells Repo data files. It is a copy of the Midi-SRD spell with scaling removed. 

It has an OnUse ItemMacro that implmenets a visual effect (VFX) by picking from a list of JB2A animations.  The animations selected are picked based on the distance between the two tokens involved in the casting. 

At higher caster levels (5+) this spell is supposed to have seperate beams that each have a to-hit roll, and I presume chance to break concentration.  I've chosen to implment this by making the spell itself not scale, the player simply needs to repeat the attack an appropriate number of times.


[*Back to Cantrips List*](#cantrips)

---

### Light

Pops a dialog that allows the target to attempt a save or accept the light effect.  If light is to be applied it is added into FoundryVTT's lighting system with an option to select a color for the light.

![Light.gif](Light/Light.gif)

[*Back to Cantrips List*](#cantrips)

---

### Mage Hand

Use warpgate to summon an actor named *magehand* to the scene and rename it for uniquness and to make ownership clear.  The new name is of the form: `Owner_Name's Magehand #`
Where # is the combat round of the summoning.

The summoner of the hand may move the token.  No effort is made to remove the hand at the end of spell duration as that is rarely an issue.

![Magehand.gif](Magehand/Magehand.gif)

[*Back to Cantrips List*](#cantrips)

---

### Prestidigitation

This macro simply plays a VFX of a D12 over the casting token and spits out some text very briefly describing the spell.

![Prestidigitation_Video.gif](Prestidigitation/Prestidigitation_Video.gif)

[*Back to Cantrips List*](#cantrips)

---