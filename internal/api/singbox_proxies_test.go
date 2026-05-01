package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// fakeClashServer returns an httptest.Server that responds to a single
// GET /proxies with the provided body. Caller closes it.
func fakeClashServer(t *testing.T, body string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasSuffix(r.URL.Path, "/proxies") || r.Method != http.MethodGet {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("content-type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
}

func TestSingboxProxiesHandler_List_FiltersToCompositeGroups(t *testing.T) {
	upstream := fakeClashServer(t, `{
        "proxies": {
            "veesp-fast": {"name":"veesp-fast","type":"Selector","now":"vless-1","all":["vless-1","vless-2"],"history":[]},
            "auto":      {"name":"auto","type":"URLTest","now":"vless-2","all":["vless-1","vless-2"],"history":[]},
            "vless-1":   {"name":"vless-1","type":"VLESS","history":[{"delay":45}]},
            "vless-2":   {"name":"vless-2","type":"VLESS","history":[{"delay":78}]},
            "GLOBAL":    {"name":"GLOBAL","type":"Selector","now":"auto","all":["auto","veesp-fast","vless-1","vless-2"]},
            "DIRECT":    {"name":"DIRECT","type":"Direct"}
        }
    }`)
	t.Cleanup(upstream.Close)

	known := map[string]struct{}{"veesp-fast": {}, "auto": {}}
	h := &SingboxProxiesHandler{
		clashBaseURL:    func() string { return upstream.URL },
		knownComposites: func() map[string]struct{} { return known },
	}

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/singbox/router/proxies/list", nil)
	h.List(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, body %s", rec.Code, rec.Body.String())
	}
	var env struct {
		Success bool `json:"success"`
		Data    struct {
			Groups []SingboxProxyGroup `json:"groups"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatal(err)
	}
	if !env.Success || len(env.Data.Groups) != 2 {
		t.Fatalf("expected 2 groups, got %d: %s", len(env.Data.Groups), rec.Body.String())
	}
	tags := map[string]bool{env.Data.Groups[0].Tag: true, env.Data.Groups[1].Tag: true}
	if !tags["veesp-fast"] || !tags["auto"] {
		t.Errorf("expected veesp-fast and auto, got %v", tags)
	}
	for _, g := range env.Data.Groups {
		if g.Tag == "veesp-fast" {
			if g.Type != "selector" || g.Now != "vless-1" {
				t.Errorf("veesp-fast: %+v", g)
			}
			if len(g.Members) != 2 || g.Members[0].LastDelay != 45 {
				t.Errorf("veesp-fast members: %+v", g.Members)
			}
		}
	}
}
