const { Plugin } = require("obsidian");

module.exports = class GraphLinkRemover extends Plugin {
    async onload() {
        console.log("Load Graph Link Remover plugin");
        this.app.workspace.on("layout-change", () => this.run());
    }

    async onunload() {
        console.log("Unload Graph Link Remover plugin");
    }

    removable(graphLink) {
        /*
        - graphLink structure:
            - link: link text without URL encoding;
            - displayText: link display text;
            - original: link complete string (e.g. '[displayText](link%20sample)').
        */
        return graphLink.displayText.endsWith(".");
    }

    run() {
        const toHiddenLink = ([filepath, fileGraphLinks]) => {
            const removeHeadingId = (url) => (url.link.split("#")[0]);
            const hiddenLinks = fileGraphLinks.filter(this.removable).map(removeHeadingId);

            return {
                [filepath]: [...new Set(hiddenLinks)]
            };
        };

        const toMap = (accumulator, fileLinks) => ({ ...accumulator, ...fileLinks });

        const toModel = (link) => ({
            "source": link.source.id,
            "target": link.target.id,
            "px": link.px
        });

        for (const leaf of this.app.workspace.getLeavesOfType("graph")) {
            const view = leaf.view;
            if (!view)
                return;

            const fileLinks = this.app.metadataCache.getLinks();
            const hiddenGraphLinks = Object.entries(fileLinks).map(toHiddenLink).reduce(toMap, {});

            const hide = ({ source, target, px }) => {
                const isHidden = hiddenGraphLinks[source]?.contains(target);
                if (isHidden)
                    px.visible = false;
            };

            const graphLinks = view.renderer.links.map(toModel);
            graphLinks.forEach(hide);
        }
    }
}
