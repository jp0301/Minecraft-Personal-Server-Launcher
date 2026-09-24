# Furniture compatibility fixes (Minecraft 1.21.1)

Install `heyodd-furniture-fixes-1.21.1.zip` in the server world's `datapacks` folder.
This server-side data pack is not a client mod and is not distributed into client `mods`.

The original ModernXL 3 3.0.1 NeoForge JAR reports internal version 3.0.0.
Nineteen recipes use the obsolete result `item` field; this pack changes it to `id`.
Eleven Beautify 2.0.2 loot tables use obsolete loot-table entry `name` fields;
this pack changes those references to `value`, preserving conditions and rewards.
Original mod JARs remain unchanged and are downloaded from their publishers.

Validated with NeoForge 21.1.249 and the installed server mod set in a temporary world.
Client rendering and actual multiplayer interactions still require in-game verification.


