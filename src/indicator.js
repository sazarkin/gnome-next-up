import St from "gi://St";
import Shell from 'gi://Shell';
import Clutter from "gi://Clutter";
import * as Calendar from "resource:///org/gnome/shell/ui/calendar.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

export default class Indicator extends PanelMenu.Button {
  constructor(props) {
    super();
    this._confettiGicon = props.confettiGicon;
    this._openPrefsCallback = props.openPrefsCallback;
  }

  _init() {
    super._init(0.0, _("Next Up Indicator"));

    this._calendarSource = new Calendar.DBusEventSource();

    this._loadGUI();
    this._initialiseMenu();
  }

  _loadGUI() {
    this._menuLayout = new St.BoxLayout({
      vertical: false,
      clip_to_allocation: true,
      x_align: Clutter.ActorAlign.START,
      y_align: Clutter.ActorAlign.CENTER,
      reactive: true,
      x_expand: true,
      pack_start: false,
    });

    this._alarmIcon = new St.Icon({
      icon_name: "alarm-symbolic",
      style_class: "system-status-icon",
    });

    this.icon = this._alarmIcon;

    this.text = new St.Label({
      text: "Loading",
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
    });

    this._menuLayout.add_child(this.icon);
    this._menuLayout.add_child(this.text);
    this.add_child(this._menuLayout);

    return;
  }

  _initialiseMenu() {
    const settingsItem = new PopupMenu.PopupMenuItem(_("Settings"));
    settingsItem.connect("activate", () => {
      this._openPrefsCallback();
    });
    this.menu.addMenuItem(settingsItem);
  }

  setRefreshCallback(callback) {
    this._refreshCallback = callback;
    // Listen to calendar changes
    this._calendarChangedId = this._calendarSource.connect('changed', () => {
      if (this._refreshCallback) {
        this._refreshCallback();
      }
    });
  }

  destroy() {
    if (this._calendarChangedId) {
      this._calendarSource.disconnect(this._calendarChangedId);
      this._calendarChangedId = null;
    }
    if (this._calendarSource) {
      this._calendarSource.destroy();
      this._calendarSource = null;
    }
    super.destroy();
  }

  setText(text) {
    this.text.set_text(text);
  }

  showAlarmIcon() {
    this.icon.set_icon_name("alarm-symbolic");
  }

  showConfettiIcon() {
    this.icon.set_gicon(this._confettiGicon);
  }

  vfunc_event(event) {
    if (
      event.type() === Clutter.EventType.TOUCH_END ||
      event.type() === Clutter.EventType.BUTTON_RELEASE
    ) {
      if (event.get_button() === Clutter.BUTTON_PRIMARY) {
        try {
          const appSystem = Shell.AppSystem.get_default();
          const app = appSystem.lookup_app('org.gnome.Calendar.desktop');

          if (app) {
            app.activate();
          }
        } catch (e) {
          console.error('Failed to launch GNOME Calendar:', e);
        }
      } else {
        // Show settings menu on right click
        this.menu.toggle();
      }
    }

    return Clutter.EVENT_PROPAGATE;
  }
}
