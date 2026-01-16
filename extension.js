import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const WorkspaceIndicator = GObject.registerClass(
class WorkspaceIndicator extends St.BoxLayout {
    _init(settings) {
        super._init({ style_class: 'workspace-indicator-box' });
        
        this._settings = settings;
        this._wsManager = global.workspace_manager;

        // --- FIX 2: Refactored signal connections using connectObject ---
        // This removes the need for the arrays (_signals, _settingsSignals)

        // Watch Settings
        this._settings.connectObject(
            'changed::show-background', () => this._updateLook(),
            this
        );
        this._settings.connectObject(
            'changed::show-plus-button', () => this._update(),
            this
        );
        this._settings.connectObject(
            'changed::indicator-style', () => {
                this._updateLook();
                this._update();
            },
            this
        );

        // Watch Workspaces
        this._wsManager.connectObject(
            'notify::n-workspaces', () => this._update(),
            this
        );
        this._wsManager.connectObject(
            'active-workspace-changed', () => this._update(),
            this
        );

        this._updateLook();
        this._update();
    }

    _updateLook() {
        this.remove_style_class_name('island-style');
        // REMOVED 'underline', ADDED 'hollow-square'
        ['circle', 'square', 'hollow-square', 'dots'].forEach(s => {
            this.remove_style_class_name(`style-${s}`);
        });

        const showBg = this._settings.get_boolean('show-background');
        
        if (showBg) {
            this.add_style_class_name('island-style');
        } else {
            const style = this._settings.get_string('indicator-style');
            this.add_style_class_name(`style-${style}`);
        }
    }

    _update() {
        this.destroy_all_children();
        
        const activeIndex = this._wsManager.get_active_workspace_index();
        const nWorkspaces = this._wsManager.get_n_workspaces();
        const currentStyle = this._settings.get_string('indicator-style');
        const showBg = this._settings.get_boolean('show-background');
        const isDotStyle = (currentStyle === 'dots' && !showBg);

        // 1. Render Numbers
        for (let i = 0; i < nWorkspaces; i++) {
            const isSelected = (i === activeIndex);
            
            let btn = new St.Button({
                style_class: isSelected ? 'workspace-button active' : 'workspace-button',
                can_focus: true,
                y_align: Clutter.ActorAlign.CENTER
            });

            // Container
            let contentBox = new St.BoxLayout({
                vertical: true,
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER
            });

            let label = new St.Label({
                text: (i + 1).toString(),
                style_class: 'workspace-label',
                x_align: Clutter.ActorAlign.CENTER
            });
            contentBox.add_child(label);

            // Dot Logic
            if (isDotStyle && isSelected) {
                let dot = new St.Bin({
                    style_class: 'dot-indicator' 
                });
                contentBox.add_child(dot);
            }

            btn.set_child(contentBox);

            btn.connect('clicked', () => {
                const ws = this._wsManager.get_workspace_by_index(i);
                if (ws) ws.activate(global.get_current_time());
            });

            this.add_child(btn);
        }

        // 2. Render Plus Button
        if (this._settings.get_boolean('show-plus-button')) {
            let addBtn = new St.Button({
                style_class: 'workspace-button add-button',
                can_focus: true,
                child: new St.Icon({
                    icon_name: 'list-add-symbolic',
                    style_class: 'add-icon',
                    icon_size: 10
                })
            });

            addBtn.connect('clicked', () => {
                this._wsManager.append_new_workspace(true, global.get_current_time());
            });

            this.add_child(addBtn);
        }
    }

    destroy() {
        // --- FIX 2 (Cleanup): Clean up signals using disconnectObject(this) ---
        // This is much cleaner than looping through arrays
        this._wsManager.disconnectObject(this);
        this._settings.disconnectObject(this);
        
        super.destroy();
    }
});

// --- FIX 1: Renamed 'SimplyNavExtension' to 'WorkNavigatorExtension' ---
export default class WorkNavigatorExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = new WorkspaceIndicator(this._settings);

        this._updatePosition();

        this._posSignal = this._settings.connect('changed::panel-position', () => {
            this._updatePosition();
        });
    }

    _updatePosition() {
        if (this._indicator.get_parent()) {
            this._indicator.get_parent().remove_child(this._indicator);
        }

        const pos = this._settings.get_string('panel-position');

        if (pos === 'far-left' && Main.panel._leftBox) {
            Main.panel._leftBox.insert_child_at_index(this._indicator, 0);
        } else if (pos === 'left' && Main.panel._leftBox) {
            Main.panel._leftBox.insert_child_at_index(this._indicator, 1);
        } else if (pos === 'center' && Main.panel._centerBox) {
            Main.panel._centerBox.add_child(this._indicator);
        } else if (pos === 'right' && Main.panel._rightBox) {
            Main.panel._rightBox.insert_child_at_index(this._indicator, 0);
        } else if (pos === 'far-right' && Main.panel._rightBox) {
            Main.panel._rightBox.add_child(this._indicator);
        }
    }

    disable() {
        if (this._posSignal) {
            this._settings.disconnect(this._posSignal);
            this._posSignal = null;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._settings = null;
    }
}
//Edited by @Wicked_Kakashi on github
