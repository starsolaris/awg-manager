package updater

import "testing"

func TestChangelogURLForChannel(t *testing.T) {
	cases := []struct {
		channel string
		want    string
	}{
		{"stable", "http://repo.hoaxisr.ru/CHANGELOG.md"},
		{"develop", "http://repo.hoaxisr.ru/develop/CHANGELOG.md"},
		{"", "http://repo.hoaxisr.ru/CHANGELOG.md"},
	}
	for _, c := range cases {
		if got := changelogURLForChannel(c.channel); got != c.want {
			t.Errorf("changelogURLForChannel(%q) = %q, want %q", c.channel, got, c.want)
		}
	}
}
