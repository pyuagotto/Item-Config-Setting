//@ts-check
import { world, system, Player } from '@minecraft/server';
import { ModalFormData, FormCancelationReason } from '@minecraft/server-ui';
import config from './config.js';

/**
 * 
 * @param {Player} source 
 * @param {Boolean} sendmsg 
 */
const openConfigForm = function(source, sendmsg){
    const container = source.getComponent("minecraft:inventory")?.container;
    const slot = source.selectedSlotIndex;
    const mainhandItem = container?.getItem(slot);
   
    if(mainhandItem){
        if(sendmsg) source.sendMessage("§bチャットを閉じるとformが表示されます§r");
        const nowName = mainhandItem.nameTag || "";
        const nowLore = mainhandItem.getLore() || [];

        const modalForm = new ModalFormData();
        modalForm.title("アイテムの設定");
        modalForm.textField("Name", "名前", nowName);

        nowLore.forEach((lore, index) => {
            modalForm.textField(`Lore${index + 1}`, "説明", lore);
        });
        
        modalForm.textField(`Lore${nowLore.length + 1}`, "説明", ""); // 空のフィールドを追加

        //@ts-ignore
        modalForm.show(source).then(modalFormResponse => {
            if(!modalFormResponse.canceled && modalFormResponse.formValues){
                const [newName, ...loreValues] = modalFormResponse.formValues;
                const loreList = loreValues
                    .filter(lore => typeof lore === "string")
                    .map(lore => lore.trim())
                    .filter(lore => lore !== "");

                if(typeof newName === "string") mainhandItem.nameTag = newName;
                mainhandItem.setLore(loreList);

                container?.setItem(slot, mainhandItem); 
            }else if(modalFormResponse.cancelationReason == FormCancelationReason.UserBusy){
                openConfigForm(source, false);
            }
        });
    }else{
        source.sendMessage("§cこのコマンドを使用するにはアイテムをメインハンドに持つ必要があります§r");
    }
};

world.beforeEvents.chatSend.subscribe((ev) => {
    const { message, sender } = ev;

    if(message == config.commandPrefix + "itemconfig"){
        ev.cancel = true;

        if(sender.isOp()){
            system.run(() => {
                openConfigForm(sender, true);
            });
        }else{
            sender.sendMessage("§cこのコマンドを実行する権限がありません\n必要権限:OP§r");
        }
    }
});