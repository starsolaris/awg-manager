package transport

import (
	"fmt"
	"strings"
)

// pathToCommand парсит RCI-путь в JSON-дерево для batch-POST'а.
//
// Возвращает:
//   - cmd — JSON-дерево для упаковки в batch request
//   - unwrapKeys — список ключей для walk'а внутрь response item'а,
//     чтобы достать данные эквивалентные direct GET. NDMS оборачивает
//     batch response item в путь-tree (`{"show":{"version":{...content...}}}`),
//     callers ожидают direct content (как от direct GET).
//
// Поддерживает формы:
//
//	"/show/interface/"                            → cmd {"show":{"interface":{}}}, unwrap ["show","interface"]
//	"/show/interface/Wireguard0"                  → cmd {"show":{"interface":{"name":"Wireguard0"}}}, unwrap ["show","interface"]
//	"/show/interface/system-name?name=Wireguard0" → cmd {"show":{"interface":{"system-name":{"name":"Wireguard0"}}}}, unwrap ["show","interface","system-name"]
//	"/show/interface/Wireguard0/wireguard/peer"   → cmd {"show":{"interface":{"name":"Wireguard0","wireguard":{"peer":{}}}}}, unwrap ["show","interface","wireguard","peer"]
//	"/show/sc/dns-proxy/route"                    → cmd {"show":{"sc":{"dns-proxy":{"route":{}}}}}, unwrap ["show","sc","dns-proxy","route"]
//	"/show/running-config"                        → cmd {"show":{"running-config":{}}}, unwrap ["show","running-config"]
//
// Эвристика: последний "содержательный" сегмент это leaf. Если последний
// сегмент — name-like (без `?`) после трёх и более сегментов — он
// становится {name: <value>} параметром предыдущего узла. Если последний
// сегмент содержит `?k=v` — параметры применяются к leaf'у. Leaf без
// параметров получает значение `{}` (empty object) — NDMS требует
// non-null для batch query, иначе вернёт пустой response.
func pathToCommand(path string) (any, []string, error) {
	path = strings.TrimPrefix(path, "/")
	if path == "" {
		return nil, nil, fmt.Errorf("pathToCommand: empty path")
	}

	hasTrailingSlash := strings.HasSuffix(path, "/")
	path = strings.TrimSuffix(path, "/")

	segments := strings.Split(path, "/")
	if len(segments) == 0 {
		return nil, nil, fmt.Errorf("pathToCommand: no segments")
	}

	last := segments[len(segments)-1]
	var leafParams map[string]any

	if idx := strings.Index(last, "?"); idx >= 0 {
		paramStr := last[idx+1:]
		last = last[:idx]
		if last == "" || paramStr == "" {
			return nil, nil, fmt.Errorf("pathToCommand: malformed query in %q", path)
		}
		segments[len(segments)-1] = last

		leafParams = map[string]any{}
		for _, kv := range strings.Split(paramStr, "&") {
			eq := strings.Index(kv, "=")
			if eq <= 0 || eq == len(kv)-1 {
				return nil, nil, fmt.Errorf("pathToCommand: malformed param %q in %q", kv, path)
			}
			leafParams[kv[:eq]] = kv[eq+1:]
		}
	}

	// "/show/.../interface/<name>/<tail...>" — the segment right after a
	// literal "interface" segment is the interface NAME ({name:...} param),
	// not a command key, and any tail (e.g. wireguard/peer, wireguard/asc)
	// nests under the interface node alongside name. Without this, <name> is
	// emitted as a literal command key; NDMS then returns an empty/object
	// envelope instead of the array a direct GET gives — the batched
	// peer/asc fetch then fails to decode (json: object into []peerWire).
	// Engaged only when a tail follows the name, so the no-tail forms
	// (/show/interface/<name>, /show/interface/) and the terminal
	// /show/interface/system-name?name=... lookup fall through below.
	ifIdx := -1
	for i, s := range segments {
		if s == "interface" {
			ifIdx = i
			break
		}
	}
	if ifIdx >= 0 && len(segments) >= ifIdx+3 {
		name := segments[ifIdx+1]
		tail := segments[ifIdx+2:] // ≥1 segment; tail[len-1] is the leaf
		prefix := segments[:ifIdx] // e.g. ["show"] or ["show","rc"]

		var leafVal any = map[string]any{}
		if leafParams != nil {
			leafVal = leafParams
		}
		sub := leafVal
		for i := len(tail) - 1; i >= 1; i-- {
			sub = map[string]any{tail[i]: sub}
		}
		ifaceNode := map[string]any{"name": name, tail[0]: sub}

		var cur any = map[string]any{"interface": ifaceNode}
		for i := len(prefix) - 1; i >= 0; i-- {
			cur = map[string]any{prefix[i]: cur}
		}

		// unwrap walks the command path WITHOUT the name value — NDMS wraps
		// the response item by command keys only, never by the name.
		unwrapKeys := make([]string, 0, len(prefix)+1+len(tail))
		unwrapKeys = append(unwrapKeys, prefix...)
		unwrapKeys = append(unwrapKeys, "interface")
		unwrapKeys = append(unwrapKeys, tail...)
		return cur, unwrapKeys, nil
	}

	var leafKey string
	var leafValue any

	if leafParams != nil {
		// "/show/interface/system-name?name=Wireguard0"
		// → segments [show, interface, system-name], leafParams {name: Wireguard0}
		leafKey = last
		leafValue = leafParams
		segments = segments[:len(segments)-1]
	} else if hasTrailingSlash {
		// "/show/interface/" → leaf is "interface", empty params {}
		leafKey = last
		leafValue = map[string]any{}
		segments = segments[:len(segments)-1]
	} else if len(segments) == 3 && segments[1] == "interface" {
		// "/show/interface/Wireguard0" — единственный известный 3-сегментный
		// путь, где последний сегмент это NAME parameter, а не resource leaf.
		// Все остальные 3-seg пути (/show/ip/hotspot, /show/ip/route,
		// /show/ip/policy, /show/rc/dns-proxy, /show/wireguard/server, …) —
		// это путь до leaf'а, last обрабатывается ниже в общей ветке.
		leafKey = "interface"
		leafValue = map[string]any{"name": last}
		segments = segments[:len(segments)-2]
	} else {
		// Общий случай: last — leaf endpoint без параметров.
		// Покрывает 2-seg ("/show/version", "/show/running-config"),
		// 3-seg не-interface ("/show/ip/hotspot"),
		// 4+-seg ("/show/rc/ip/host", "/show/sc/dns-proxy/route", …).
		leafKey = last
		leafValue = map[string]any{}
		segments = segments[:len(segments)-1]
	}

	// unwrapKeys = segments + leafKey (по этим ключам walk'аем response
	// чтобы достать content — параметр-значения вроде "Wireguard0" в
	// unwrap path НЕ входят, т.к. NDMS не оборачивает по name).
	unwrapKeys := make([]string, 0, len(segments)+1)
	unwrapKeys = append(unwrapKeys, segments...)
	unwrapKeys = append(unwrapKeys, leafKey)

	tree := map[string]any{leafKey: leafValue}
	for i := len(segments) - 1; i >= 0; i-- {
		tree = map[string]any{segments[i]: tree}
	}
	return tree, unwrapKeys, nil
}
