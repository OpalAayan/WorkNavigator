import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio'; 
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class WorkNavigatorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({ title: 'Appearance' });
        page.add(group);

        // 1. Panel Position
        const rowPos = new Adw.ComboRow({
            title: 'Panel Position',
            subtitle: 'Where to place the navigator',
            model: new Gtk.StringList({ strings: ['Far Left', 'Left', 'Center', 'Right', 'Far Right'] })
        });
        group.add(rowPos);
        
        const posValues = ['far-left', 'left', 'center', 'right', 'far-right'];
        const currentPos = settings.get_string('panel-position');
        let idx = posValues.indexOf(currentPos);
        if (idx === -1) idx = 1;
        rowPos.set_selected(idx);

        rowPos.connect('notify::selected', () => {
            settings.set_string('panel-position', posValues[rowPos.selected]);
        });

        // 2. Show Background (Master Switch)
        const rowBg = new Adw.SwitchRow({
            title: 'Show Background',
            subtitle: 'Enable the capsule island look'
        });
        group.add(rowBg);
        settings.bind('show-background', rowBg, 'active', 0);

        // 3. Indicator Style (Conditional)
        // UPDATED LIST: Removed Underline, Added Hollow Square
        const rowStyle = new Adw.ComboRow({
            title: 'Indicator Style',
            subtitle: 'Shape of the active workspace indicator',
            model: new Gtk.StringList({ strings: ['Circle', 'Square', 'Hollow Square', 'Dots'] })
        });
        group.add(rowStyle);

        const styleValues = ['circle', 'square', 'hollow-square', 'dots'];
        const currentStyle = settings.get_string('indicator-style');
        let styleIdx = styleValues.indexOf(currentStyle);
        if (styleIdx === -1) styleIdx = 0;
        rowStyle.set_selected(styleIdx);

        rowStyle.connect('notify::selected', () => {
            settings.set_string('indicator-style', styleValues[rowStyle.selected]);
        });

        settings.bind('show-background', rowStyle, 'visible', Gio.SettingsBindFlags.INVERT_BOOLEAN);

        // 4. Show Plus Button
        const rowPlus = new Adw.SwitchRow({
            title: 'Show Add Button',
            subtitle: 'Display the + icon'
        });
        group.add(rowPlus);
        settings.bind('show-plus-button', rowPlus, 'active', 0);

        window.add(page);
    }
}