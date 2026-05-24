package hydraroute

import (
	"os"
	"path/filepath"
)

// geoEntryPriority scores catalog entries when the same type+basename appears
// twice (e.g. awg-manager/geo and HydraRoute/geofile). Higher wins.
func geoEntryPriority(e GeoFileEntry, geoDir string) int {
	score := 0
	if geoDir != "" && hasPathPrefix(filepath.Clean(e.Path), geoDir) {
		score += 100
	}
	if !e.External {
		score += 50
	}
	return score
}

// reconcileUnlocked normalizes the in-memory catalog:
//   - External matches the path (AWGM geo dir → false, HR tree → true)
//   - drops entries whose files are missing on disk
//   - when type and basename collide, keeps the higher-priority path
//
// Caller must hold s.mu (write lock). Returns whether entries changed.
func (s *GeoDataStore) reconcileUnlocked() bool {
	changed := false

	for i := range s.entries {
		want := s.isHRPath(s.entries[i].Path)
		if s.entries[i].External != want {
			s.entries[i].External = want
			changed = true
		}
	}

	alive := s.entries[:0]
	for _, e := range s.entries {
		if _, err := os.Stat(e.Path); err != nil {
			delete(s.tagCache, e.Path)
			changed = true
			continue
		}
		alive = append(alive, e)
	}
	s.entries = alive

	if len(s.entries) < 2 {
		return changed
	}

	keep := make([]bool, len(s.entries))
	for i := range keep {
		keep[i] = true
	}

	for i := 0; i < len(s.entries); i++ {
		if !keep[i] {
			continue
		}
		for j := i + 1; j < len(s.entries); j++ {
			if !keep[j] {
				continue
			}
			ei, ej := s.entries[i], s.entries[j]
			if ei.Type != ej.Type || filepath.Base(ei.Path) != filepath.Base(ej.Path) {
				continue
			}
			pi, pj := geoEntryPriority(ei, s.geoDir), geoEntryPriority(ej, s.geoDir)
			if pi == pj {
				// Stable tie-break: keep the earlier catalog entry.
				continue
			}
			if pi > pj {
				keep[j] = false
				delete(s.tagCache, ej.Path)
			} else {
				keep[i] = false
				delete(s.tagCache, ei.Path)
				break
			}
			changed = true
		}
	}

	deduped := s.entries[:0]
	for i, e := range s.entries {
		if keep[i] {
			deduped = append(deduped, e)
		} else {
			changed = true
		}
	}
	s.entries = deduped
	return changed
}

// dedupeGeoPaths returns unique paths in first-seen order.
func dedupeGeoPaths(paths []string) []string {
	if len(paths) < 2 {
		return paths
	}
	seen := make(map[string]struct{}, len(paths))
	out := make([]string, 0, len(paths))
	for _, p := range paths {
		clean := filepath.Clean(p)
		if clean == "" {
			continue
		}
		if _, ok := seen[clean]; ok {
			continue
		}
		seen[clean] = struct{}{}
		out = append(out, p)
	}
	return out
}
