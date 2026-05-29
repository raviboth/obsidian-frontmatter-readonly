import {
	App,
	MarkdownView,
	Menu,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
} from "obsidian";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

const readOnlyExtension = (readonly: boolean) => [
	EditorState.readOnly.of(readonly),
	EditorView.editable.of(!readonly),
];

interface FrontmatterReadonlySettings {
	propertyName: string;
}

const DEFAULT_SETTINGS: FrontmatterReadonlySettings = {
	propertyName: "readonly",
};

export default class FrontmatterReadonlyPlugin extends Plugin {
	settings!: FrontmatterReadonlySettings;
	private editableCompartment = new Compartment();
	private statusBar!: HTMLElement;

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(
			this.editableCompartment.of(readOnlyExtension(false))
		);

		this.statusBar = this.addStatusBarItem();
		this.statusBar.addClass("frontmatter-readonly-statusbar");
		this.registerDomEvent(this.statusBar, "click", () => {
			const file = this.app.workspace.getActiveFile();
			if (file) this.toggle(file);
		});

		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				this.applyReadonly(file);
				this.updateStatusBar(file);
			})
		);

		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				this.applyReadonly(file);
				const active = this.app.workspace.getActiveFile();
				if (active?.path === file.path) this.updateStatusBar(file);
			})
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				const file = this.app.workspace.getActiveFile();
				this.applyReadonly(file);
				this.updateStatusBar(file);
			})
		);

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				if (!(file instanceof TFile) || file.extension !== "md") return;
				const ro = this.isReadonly(file);
				menu.addItem((item) =>
					item
						.setTitle(ro ? "Make editable" : "Make read-only")
						.setIcon(ro ? "pencil" : "lock")
						.onClick(() => this.toggle(file))
				);
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, _editor, view) => {
				if (!(view instanceof MarkdownView)) return;
				const file = view.file;
				if (!file || file.extension !== "md") return;
				const ro = this.isReadonly(file);
				menu.addItem((item) =>
					item
						.setTitle(ro ? "Make editable" : "Make read-only")
						.setIcon(ro ? "pencil" : "lock")
						.onClick(() => this.toggle(file))
				);
			})
		);

		this.addCommand({
			id: "toggle-readonly",
			name: "Toggle read-only on current note",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;
				if (checking) return true;
				this.toggle(file);
				return true;
			},
		});

		this.addSettingTab(new FrontmatterReadonlySettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			const file = this.app.workspace.getActiveFile();
			this.applyReadonly(file);
			this.updateStatusBar(file);
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		const file = this.app.workspace.getActiveFile();
		this.applyReadonly(file);
		this.updateStatusBar(file);
	}

	private isReadonly(file: TFile): boolean {
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
		return fm?.[this.settings.propertyName] === true;
	}

	private applyReadonly(file: TFile | null) {
		if (!file) return;
		const readonly = this.isReadonly(file);

		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) return;
			if (view.file?.path !== file.path) return;
			const cm = (view.editor as unknown as { cm: EditorView }).cm;
			if (!cm) return;
			try {
				cm.dispatch({
					effects: this.editableCompartment.reconfigure(
						readOnlyExtension(readonly)
					),
				});
			} catch (e) {
				console.error("[frontmatter-readonly] dispatch failed", e);
			}
		});
	}

	private updateStatusBar(file: TFile | null) {
		if (!file || file.extension !== "md" || !this.isReadonly(file)) {
			this.statusBar.empty();
			this.statusBar.removeAttribute("title");
			this.statusBar.style.cursor = "";
			return;
		}
		this.statusBar.setText("🔒 Read-only");
		this.statusBar.setAttr("title", "Click to make editable");
		this.statusBar.style.cursor = "pointer";
	}

	private async toggle(file: TFile) {
		const readonly = this.isReadonly(file);
		const prop = this.settings.propertyName;
		await this.app.fileManager.processFrontMatter(file, (fm) => {
			if (readonly) {
				delete fm[prop];
			} else {
				fm[prop] = true;
			}
		});
		new Notice(readonly ? "Note is now editable" : "Note is now read-only");
	}
}

class FrontmatterReadonlySettingTab extends PluginSettingTab {
	plugin: FrontmatterReadonlyPlugin;

	constructor(app: App, plugin: FrontmatterReadonlyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Frontmatter property name")
			.setDesc(
				"Property that flags a note as read-only. Default: readonly. A note with `<property>: true` in its frontmatter is treated as read-only inside the editor."
			)
			.addText((text) =>
				text
					.setPlaceholder("readonly")
					.setValue(this.plugin.settings.propertyName)
					.onChange(async (value) => {
						const sanitized = value.trim() || "readonly";
						this.plugin.settings.propertyName = sanitized;
						await this.plugin.saveSettings();
					})
			);
	}
}
