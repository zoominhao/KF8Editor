class BuffWindow extends KFDEdtWrapWindow {
    constructor(jWin, kfdTable) {
        super(jWin, kfdTable);

        this.btn_Save = $('#save_buff');
        this.btn_Save.on('click', function () {
            this.OnSaveClick();
        }.bind(this));
        this.btn_Save.visible = true;

        this.onSave = null;
    }

    OnSaveClick() {
        if (this.onSave) {
            this.onSave.call();
        }
    }
}