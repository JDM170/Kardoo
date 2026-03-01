/**
 * Export formats conformes aux RFC
 * jCard : RFC 7095
 * xCard : RFC 6351
 * CSV   : format Google Contacts (standard de facto)
 */

// ─── jCard (RFC 7095) ────────────────────────────────────────────────────────

function contactToJCard(c, has) {
  const props = [];

  props.push(["version", {}, "text", "4.0"]);

  if (has("fn") && c.fn) props.push(["fn", {}, "text", c.fn]);

  if (
    has("n") &&
    (c.lastName || c.firstName || c.middleName || c.prefix || c.suffix)
  ) {
    props.push([
      "n",
      {},
      "text",
      [
        c.lastName || "",
        c.firstName || "",
        c.middleName || "",
        c.prefix || "",
        c.suffix || "",
      ],
    ]);
  }

  if (has("org") && c.org) props.push(["org", {}, "text", c.org]);
  if (has("title") && c.title) props.push(["title", {}, "text", c.title]);
  if (has("role") && c.role) props.push(["role", {}, "text", c.role]);
  if (has("nickname") && c.nickname)
    props.push(["nickname", {}, "text", c.nickname]);
  if (has("bday") && c.bday) props.push(["bday", {}, "date", c.bday]);
  if (has("anniversary") && c.anniversary)
    props.push(["anniversary", {}, "date", c.anniversary]);
  if (has("gender") && c.gender) props.push(["gender", {}, "text", c.gender]);
  if (has("note") && c.note) props.push(["note", {}, "text", c.note]);
  if (has("geo") && c.geo) props.push(["geo", {}, "uri", c.geo]);
  if (has("tz") && c.tz) props.push(["tz", {}, "text", c.tz]);
  if (has("uid") && c.uid)
    props.push([
      "uid",
      {},
      "uri",
      c.uid.startsWith("urn:") ? c.uid : `urn:uuid:${c.uid}`,
    ]);
  if (has("rev") && c.rev) props.push(["rev", {}, "timestamp", c.rev]);
  if (has("categories") && c.categories)
    props.push(["categories", {}, "text", c.categories]);

  if (c.kind && c.kind !== "individual")
    props.push(["kind", {}, "text", c.kind]);

  if (has("tel")) {
    c.tel?.forEach((t) => {
      if (!t.value) return;
      props.push([
        "tel",
        t.type ? { type: [t.type.toLowerCase()] } : {},
        "uri",
        `tel:${t.value}`,
      ]);
    });
  }

  if (has("email")) {
    c.email?.forEach((e) => {
      if (!e.value) return;
      props.push([
        "email",
        e.type ? { type: [e.type.toLowerCase()] } : {},
        "text",
        e.value,
      ]);
    });
  }

  if (has("adr")) {
    c.adr?.forEach((a) => {
      if (!a.raw) return;
      props.push([
        "adr",
        a.type ? { type: [a.type.toLowerCase()] } : {},
        "text",
        [
          a.raw[0] || "",
          a.raw[1] || "",
          a.raw[2] || "",
          a.raw[3] || "",
          a.raw[4] || "",
          a.raw[5] || "",
          a.raw[6] || "",
        ],
      ]);
    });
  }

  if (has("url")) {
    c.url?.forEach((u) => {
      if (!u.value) return;
      props.push([
        "url",
        u.type ? { type: [u.type.toLowerCase()] } : {},
        "uri",
        u.value,
      ]);
    });
  }

  if (has("lang")) {
    c.lang?.forEach((l) => {
      if (!l.value) return;
      props.push([
        "lang",
        l.pref ? { pref: l.pref } : {},
        "language-tag",
        l.value,
      ]);
    });
  }

  if (has("impp")) {
    c.impp?.forEach((i) => {
      if (!i.value) return;
      props.push([
        "impp",
        i.type ? { type: [i.type.toLowerCase()] } : {},
        "uri",
        i.value,
      ]);
    });
  }

  if (has("related")) {
    c.related?.forEach((r) => {
      if (!r.value) return;
      props.push([
        "related",
        r.type ? { type: [r.type.toLowerCase()] } : {},
        "text",
        r.value,
      ]);
    });
  }

  if (c.kind === "group") {
    c.members?.forEach((m) => {
      if (!m.value) return;
      const uri =
        m.type === "email" ? `mailto:${m.value}` : `urn:uuid:${m.value}`;
      props.push(["member", {}, "uri", uri]);
    });
  }

  return ["vcard", props];
}

export function toJCard(contacts, exportFields = []) {
  const all = exportFields.length === 0;
  const has = (field) => all || exportFields.includes(field);
  const jcards = contacts.map((c) => contactToJCard(c, has));
  return JSON.stringify(jcards.length === 1 ? jcards[0] : jcards, null, 2);
}

// ─── xCard (RFC 6351) ────────────────────────────────────────────────────────

const XCARD_NS = "urn:ietf:params:xml:ns:vcard-4.0";

function esc(val) {
  return String(val || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function prop(name, params, valueType, value) {
  const lines = [`    <${name}>`];
  if (params && Object.keys(params).length > 0) {
    lines.push("      <parameters>");
    Object.entries(params).forEach(([k, v]) => {
      lines.push(`        <${k}>`);
      const vals = Array.isArray(v) ? v : [v];
      vals.forEach((vv) => lines.push(`          <text>${esc(vv)}</text>`));
      lines.push(`        </${k}>`);
    });
    lines.push("      </parameters>");
  }
  if (Array.isArray(value)) {
    value.forEach((v) =>
      lines.push(`      <${valueType}>${esc(v)}</${valueType}>`),
    );
  } else {
    lines.push(`      <${valueType}>${esc(value)}</${valueType}>`);
  }
  lines.push(`    </${name}>`);
  return lines.join("\n");
}

function contactToXCard(c, has) {
  const lines = ["  <vcard>"];

  lines.push(prop("version", {}, "text", "4.0"));
  if (has("fn") && c.fn) lines.push(prop("fn", {}, "text", c.fn));

  if (
    has("n") &&
    (c.lastName || c.firstName || c.middleName || c.prefix || c.suffix)
  ) {
    lines.push(`    <n>`);
    lines.push(`      <surname>${esc(c.lastName)}</surname>`);
    lines.push(`      <given>${esc(c.firstName)}</given>`);
    lines.push(`      <additional>${esc(c.middleName)}</additional>`);
    lines.push(`      <prefix>${esc(c.prefix)}</prefix>`);
    lines.push(`      <suffix>${esc(c.suffix)}</suffix>`);
    lines.push(`    </n>`);
  }

  if (has("org") && c.org) lines.push(prop("org", {}, "text", c.org));
  if (has("title") && c.title) lines.push(prop("title", {}, "text", c.title));
  if (has("role") && c.role) lines.push(prop("role", {}, "text", c.role));
  if (has("nickname") && c.nickname)
    lines.push(prop("nickname", {}, "text", c.nickname));
  if (has("bday") && c.bday) lines.push(prop("bday", {}, "date", c.bday));
  if (has("anniversary") && c.anniversary)
    lines.push(prop("anniversary", {}, "date", c.anniversary));
  if (has("gender") && c.gender)
    lines.push(prop("gender", {}, "sex", c.gender));
  if (has("note") && c.note) lines.push(prop("note", {}, "text", c.note));
  if (has("geo") && c.geo) lines.push(prop("geo", {}, "uri", c.geo));
  if (has("tz") && c.tz) lines.push(prop("tz", {}, "text", c.tz));
  if (has("uid") && c.uid)
    lines.push(
      prop(
        "uid",
        {},
        "uri",
        c.uid.startsWith("urn:") ? c.uid : `urn:uuid:${c.uid}`,
      ),
    );
  if (has("rev") && c.rev) lines.push(prop("rev", {}, "timestamp", c.rev));
  if (c.kind && c.kind !== "individual")
    lines.push(prop("kind", {}, "text", c.kind));
  if (has("categories") && c.categories)
    lines.push(prop("categories", {}, "text", c.categories));

  if (has("tel")) {
    c.tel?.forEach((t) => {
      if (!t.value) return;
      lines.push(
        prop(
          "tel",
          t.type ? { type: [t.type.toLowerCase()] } : {},
          "uri",
          `tel:${t.value}`,
        ),
      );
    });
  }

  if (has("email")) {
    c.email?.forEach((e) => {
      if (!e.value) return;
      lines.push(
        prop(
          "email",
          e.type ? { type: [e.type.toLowerCase()] } : {},
          "text",
          e.value,
        ),
      );
    });
  }

  if (has("adr")) {
    c.adr?.forEach((a) => {
      if (!a.raw) return;
      const paramStr = a.type
        ? `\n      <parameters>\n        <type><text>${esc(a.type.toLowerCase())}</text></type>\n      </parameters>`
        : "";
      lines.push(`    <adr>${paramStr}`);
      lines.push(`      <pobox>${esc(a.raw[0])}</pobox>`);
      lines.push(`      <ext>${esc(a.raw[1])}</ext>`);
      lines.push(`      <street>${esc(a.raw[2])}</street>`);
      lines.push(`      <locality>${esc(a.raw[3])}</locality>`);
      lines.push(`      <region>${esc(a.raw[4])}</region>`);
      lines.push(`      <code>${esc(a.raw[5])}</code>`);
      lines.push(`      <country>${esc(a.raw[6])}</country>`);
      lines.push(`    </adr>`);
    });
  }

  if (has("url")) {
    c.url?.forEach((u) => {
      if (!u.value) return;
      lines.push(
        prop(
          "url",
          u.type ? { type: [u.type.toLowerCase()] } : {},
          "uri",
          u.value,
        ),
      );
    });
  }

  if (has("lang")) {
    c.lang?.forEach((l) => {
      if (!l.value) return;
      lines.push(
        prop("lang", l.pref ? { pref: l.pref } : {}, "language-tag", l.value),
      );
    });
  }

  if (has("impp")) {
    c.impp?.forEach((i) => {
      if (!i.value) return;
      lines.push(
        prop(
          "impp",
          i.type ? { type: [i.type.toLowerCase()] } : {},
          "uri",
          i.value,
        ),
      );
    });
  }

  if (has("related")) {
    c.related?.forEach((r) => {
      if (!r.value) return;
      lines.push(
        prop(
          "related",
          r.type ? { type: [r.type.toLowerCase()] } : {},
          "text",
          r.value,
        ),
      );
    });
  }

  if (c.kind === "group") {
    c.members?.forEach((m) => {
      if (!m.value) return;
      const uri =
        m.type === "email" ? `mailto:${m.value}` : `urn:uuid:${m.value}`;
      lines.push(prop("member", {}, "uri", uri));
    });
  }

  lines.push("  </vcard>");
  return lines.join("\n");
}

export function toXCard(contacts, exportFields = []) {
  const all = exportFields.length === 0;
  const has = (field) => all || exportFields.includes(field);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<vcards xmlns="${XCARD_NS}">`,
    ...contacts.map((c) => contactToXCard(c, has)),
    "</vcards>",
  ];
  return lines.join("\n");
}

// ─── CSV (format Google Contacts) ────────────────────────────────────────────

export function toCSV(contacts, exportFields = []) {
  const all = exportFields.length === 0;
  const has = (field) => all || exportFields.includes(field);

  const csvEsc = (val) => {
    const s = String(val || "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  // Construction dynamique des headers et valeurs selon exportFields
  const columns = [
    { field: "fn", header: "Name", val: (c) => c.fn },
    { field: "n", header: "Given Name", val: (c) => c.firstName },
    { field: "n", header: "Additional Name", val: (c) => c.middleName },
    { field: "n", header: "Family Name", val: (c) => c.lastName },
    { field: "n", header: "Name Prefix", val: (c) => c.prefix },
    { field: "n", header: "Name Suffix", val: (c) => c.suffix },
    { field: "org", header: "Organization 1 - Name", val: (c) => c.org },
    { field: "title", header: "Organization 1 - Title", val: (c) => c.title },
    { field: "org", header: "Organization 1 - Department", val: () => "" },
    { field: "nickname", header: "Nickname", val: (c) => c.nickname },
    { field: "bday", header: "Birthday", val: (c) => c.bday },
    { field: "gender", header: "Gender", val: (c) => c.gender },
    { field: "note", header: "Notes", val: (c) => c.note },
    {
      field: "tel",
      header: "Phone 1 - Type",
      val: (c) => c.tel?.[0]?.type || "",
    },
    {
      field: "tel",
      header: "Phone 1 - Value",
      val: (c) => c.tel?.[0]?.value || "",
    },
    {
      field: "tel",
      header: "Phone 2 - Type",
      val: (c) => c.tel?.[1]?.type || "",
    },
    {
      field: "tel",
      header: "Phone 2 - Value",
      val: (c) => c.tel?.[1]?.value || "",
    },
    {
      field: "tel",
      header: "Phone 3 - Type",
      val: (c) => c.tel?.[2]?.type || "",
    },
    {
      field: "tel",
      header: "Phone 3 - Value",
      val: (c) => c.tel?.[2]?.value || "",
    },
    {
      field: "email",
      header: "E-mail 1 - Type",
      val: (c) => c.email?.[0]?.type || "",
    },
    {
      field: "email",
      header: "E-mail 1 - Value",
      val: (c) => c.email?.[0]?.value || "",
    },
    {
      field: "email",
      header: "E-mail 2 - Type",
      val: (c) => c.email?.[1]?.type || "",
    },
    {
      field: "email",
      header: "E-mail 2 - Value",
      val: (c) => c.email?.[1]?.value || "",
    },
    {
      field: "adr",
      header: "Address 1 - Type",
      val: (c) => c.adr?.[0]?.type || "",
    },
    {
      field: "adr",
      header: "Address 1 - Street",
      val: (c) => c.adr?.[0]?.raw?.[2] || "",
    },
    {
      field: "adr",
      header: "Address 1 - City",
      val: (c) => c.adr?.[0]?.raw?.[3] || "",
    },
    {
      field: "adr",
      header: "Address 1 - Region",
      val: (c) => c.adr?.[0]?.raw?.[4] || "",
    },
    {
      field: "adr",
      header: "Address 1 - Postal Code",
      val: (c) => c.adr?.[0]?.raw?.[5] || "",
    },
    {
      field: "adr",
      header: "Address 1 - Country",
      val: (c) => c.adr?.[0]?.raw?.[6] || "",
    },
    {
      field: "adr",
      header: "Address 2 - Type",
      val: (c) => c.adr?.[1]?.type || "",
    },
    {
      field: "adr",
      header: "Address 2 - Street",
      val: (c) => c.adr?.[1]?.raw?.[2] || "",
    },
    {
      field: "adr",
      header: "Address 2 - City",
      val: (c) => c.adr?.[1]?.raw?.[3] || "",
    },
    {
      field: "adr",
      header: "Address 2 - Region",
      val: (c) => c.adr?.[1]?.raw?.[4] || "",
    },
    {
      field: "adr",
      header: "Address 2 - Postal Code",
      val: (c) => c.adr?.[1]?.raw?.[5] || "",
    },
    {
      field: "adr",
      header: "Address 2 - Country",
      val: (c) => c.adr?.[1]?.raw?.[6] || "",
    },
    {
      field: "url",
      header: "Website 1 - Type",
      val: (c) => c.url?.[0]?.type || "",
    },
    {
      field: "url",
      header: "Website 1 - Value",
      val: (c) => c.url?.[0]?.value || "",
    },
    {
      field: "url",
      header: "Website 2 - Type",
      val: (c) => c.url?.[1]?.type || "",
    },
    {
      field: "url",
      header: "Website 2 - Value",
      val: (c) => c.url?.[1]?.value || "",
    },
  ].filter((col) => has(col.field));

  const headers = columns.map((col) => col.header);
  const rows = contacts.map((c) =>
    columns.map((col) => csvEsc(col.val(c))).join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

export function sanitizeFilename(name) {
  return (
    (name || "contact").replace(/[^a-zA-Z0-9_\-. ]/g, "_").trim() || "contact"
  );
}
