const CHC_LOGO_MARKERS = [
    "goldwithlettersContemporary-health-center-logo-retina.png",
    "contemporary-health-center-logo"
];

function isChcLogo(img) {
    const src = (img.getAttribute("src") || "").toLowerCase();
    const alt = (img.getAttribute("alt") || "").toLowerCase();

    return CHC_LOGO_MARKERS.some(marker => src.includes(marker.toLowerCase())) ||
        alt.includes("chc logo") ||
        alt.includes("contemporary health center");
}

function isClinicContactBlock(element) {
    const text = (element.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!text) return false;

    const hasClinicName = text.includes("contemporary health center");
    const hasClinicAddress = text.includes("6150 diamond center court");
    const hasClinicPhone = text.includes("239-561-9191");

    return (hasClinicName || hasClinicAddress) && (hasClinicPhone || text.length < 180);
}

function closestRemovableLogoBlock(img, root) {
    let node = img.parentElement;

    while (node && node !== root) {
        const tag = node.tagName?.toLowerCase();
        if (!["div", "p", "span", "figure"].includes(tag)) break;

        const images = Array.from(node.querySelectorAll("img"));
        const text = (node.textContent || "").replace(/\s+/g, " ").trim();
        const isSmallBrandingBlock = images.length <= 1 && (text.length < 220 || isClinicContactBlock(node));

        if (isSmallBrandingBlock) return node;
        node = node.parentElement;
    }

    return img;
}

function removeFollowingContactBlocks(removedBlock) {
    let next = removedBlock.nextElementSibling;
    let removed = 0;

    while (next && removed < 2 && isClinicContactBlock(next)) {
        const current = next;
        next = next.nextElementSibling;
        current.remove();
        removed += 1;
    }
}

function stripWithDom(html, { keepFirstLogo }) {
    const template = document.createElement("template");
    template.innerHTML = html || "";

    const logos = Array.from(template.content.querySelectorAll("img")).filter(isChcLogo);
    logos.forEach((img, index) => {
        if (keepFirstLogo && index === 0) return;

        const block = closestRemovableLogoBlock(img, template.content);
        removeFollowingContactBlocks(block);
        block.remove();
    });

    return template.innerHTML;
}

function stripWithRegex(html, { keepFirstLogo }) {
    let seenLogo = false;

    return (html || "").replace(
        /<(div|p|figure|span)\b[^>]*>\s*<img\b[^>]*(?:goldwithlettersContemporary-health-center-logo-retina\.png|contemporary-health-center-logo|alt=["'][^"']*(?:CHC Logo|Contemporary Health Center)[^"']*)[^>]*>\s*<\/\1>\s*(?:<(div|p)\b[^>]*>[^<]*(?:Contemporary Health Center|6150 Diamond Center Court|239-561-9191)[\s\S]*?<\/\2>\s*){0,2}/gi,
        match => {
            if (keepFirstLogo && !seenLogo) {
                seenLogo = true;
                return match;
            }
            seenLogo = true;
            return "";
        }
    );
}

export function stripDuplicateChcBranding(html, options = {}) {
    const keepFirstLogo = options.keepFirstLogo ?? false;

    if (typeof document !== "undefined") {
        return stripWithDom(html, { keepFirstLogo });
    }

    return stripWithRegex(html, { keepFirstLogo });
}
