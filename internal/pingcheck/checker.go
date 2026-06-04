package pingcheck

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/hoaxisr/awg-manager/internal/storage"
	"github.com/hoaxisr/awg-manager/internal/sys/exec"
	"github.com/hoaxisr/awg-manager/internal/sys/httpclient"
)

const (
	checkTimeout = 7 * time.Second
)

var checkerHTTPClient httpclient.HTTPDoer = httpclient.DefaultClient

// checkHTTP performs HTTP 204 connectivity check through the tunnel.
func checkHTTP(ctx context.Context, ifaceName string, checkURL string) CheckResult {
	checkCtx, cancel := context.WithTimeout(ctx, checkTimeout)
	defer cancel()
	checkURL = strings.TrimSpace(checkURL)
	if checkURL == "" {
		checkURL = storage.DefaultConnectivityCheckURL
	}

	res, err := checkerHTTPClient.Do(checkCtx, httpclient.CallConfig{
		URL:            checkURL,
		Interface:      ifaceName,
		ConnectTimeout: 3 * time.Second,
		MaxTime:        5 * time.Second,
		DiscardBody:    true,
	})
	if err != nil {
		return CheckResult{
			Success: false,
			Error:   fmt.Sprintf("HTTP check failed: %v", err),
		}
	}

	httpCode := res.Metrics.HTTPCode
	var latencyMs int
	if res.Metrics.TimeConnect > 0 && res.Metrics.TimeConnect >= res.Metrics.TimeNameLookup {
		latencyMs = int((res.Metrics.TimeConnect - res.Metrics.TimeNameLookup) * 1000)
	} else {
		latencyMs = int(res.Metrics.TimeTotal * 1000)
	}

	if httpCode >= 200 && httpCode < 400 {
		return CheckResult{
			Success: true,
			Latency: latencyMs,
		}
	}

	return CheckResult{
		Success: false,
		Latency: latencyMs,
		Error:   fmt.Sprintf("unexpected HTTP code: %d", httpCode),
	}
}

// checkICMP performs ICMP ping check through the tunnel interface.
func checkICMP(ctx context.Context, ifaceName string, target string) CheckResult {
	iface := ifaceName

	// Entware ping location
	const pingTimeoutSec = "5"
	args := []string{
		"-I", iface,
		"-c", "1",
		"-W", pingTimeoutSec,
		target,
	}

	checkCtx, cancel := context.WithTimeout(ctx, checkTimeout)
	defer cancel()

	start := time.Now()
	// Use Entware ping at /opt/bin/ping
	result, err := exec.Run(checkCtx, "/opt/bin/ping", args...)
	latencyMs := int(time.Since(start).Milliseconds())

	if err != nil {
		return CheckResult{
			Success: false,
			Latency: latencyMs,
			Error:   fmt.Sprintf("ping failed: %v", exec.FormatError(result, err)),
		}
	}

	// Parse ping output for more accurate latency
	// Example: "64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=12.3 ms"
	if strings.Contains(result.Stdout, "time=") {
		latencyMs = parsePingLatency(result.Stdout)
	}

	// Check if ping was successful (exit code 0 means success)
	if result.ExitCode == 0 {
		return CheckResult{
			Success: true,
			Latency: latencyMs,
		}
	}

	return CheckResult{
		Success: false,
		Latency: latencyMs,
		Error:   "ping unsuccessful",
	}
}

// parsePingLatency extracts latency from ping output.
func parsePingLatency(output string) int {
	// Look for "time=X.X ms" or "time=X ms"
	idx := strings.Index(output, "time=")
	if idx == -1 {
		return 0
	}

	// Extract the number after "time="
	start := idx + 5
	end := start
	for end < len(output) && (output[end] == '.' || (output[end] >= '0' && output[end] <= '9')) {
		end++
	}

	if end > start {
		if val, err := strconv.ParseFloat(output[start:end], 64); err == nil {
			return int(val)
		}
	}

	return 0
}

// performCheck executes the appropriate check method using the resolved interface name.
func performCheck(ctx context.Context, ifaceName string, method string, target string, checkURL string) CheckResult {
	switch method {
	case "icmp":
		return checkICMP(ctx, ifaceName, target)
	default: // "http" is default
		return checkHTTP(ctx, ifaceName, checkURL)
	}
}
