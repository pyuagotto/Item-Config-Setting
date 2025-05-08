//@ts-check
import { system, Player, CommandPermissionLevel, CustomCommandOrigin, CustomCommandStatus } from '@minecraft/server';
import { ModalFormData } from '@minecraft/server-ui';

system.beforeEvents.startup.subscribe((ev) => {
    const registerCommand = function(name, description, callback) {
        ev.customCommandRegistry.registerCommand(
            {
                name,
                description,
                permissionLevel: CommandPermissionLevel.Admin,
            },
            callback
        );
    };

    registerCommand(
        "pyuagotto:itemconfig",
        "アイテムの名前と説明を変更します",
        openConfigForm
    );
});

/**
 * 
 * @param {CustomCommandOrigin} origin 
 * @returns {{ status: CustomCommandStatus, message?: string} | undefined }
 */
const openConfigForm = function(origin){
    if(origin.sourceEntity instanceof Player){
        const player = origin.sourceEntity;
        const container = player.getComponent("minecraft:inventory")?.container;
        const slot = player.selectedSlotIndex;
        const mainhandItem = container?.getItem(slot);
       
        if(mainhandItem){
            const nowName = mainhandItem.nameTag || "";
            const nowLore = mainhandItem.getLore() || [];
    
            const modalForm = new ModalFormData();
            modalForm.title("アイテムの設定");
            modalForm.textField("Name", "名前", { defaultValue: nowName });
    
            nowLore.forEach((lore, index) => {
                modalForm.textField(`Lore${index + 1}`, "説明", { defaultValue: lore });
            });
            
            modalForm.textField(`Lore${nowLore.length + 1}`, "説明", { defaultValue: "" }); // 空のフィールドを追加

            system.run(()=>{
                modalForm.show(player).then(modalFormResponse => {
                    if(!modalFormResponse.canceled && modalFormResponse.formValues){
                        const [newName, ...loreValues] = modalFormResponse.formValues;
                        const loreList = loreValues
                            .filter(lore => typeof lore === "string")
                            .map(lore => lore.trim())
                            .filter(lore => lore !== "");
        
                        if(typeof newName === "string") mainhandItem.nameTag = newName;
                        mainhandItem.setLore(loreList);
        
                        container?.setItem(slot, mainhandItem);
                    }
                });
            });
        }else{
            return { status: CustomCommandStatus.Failure, message: `このコマンドを使用するにはアイテムをメインハンドに持つ必要があります` };
        }
    }else{
        return { status: CustomCommandStatus.Failure, message: `このコマンドはプレイヤー以外に対して実行できません` };
    }
};