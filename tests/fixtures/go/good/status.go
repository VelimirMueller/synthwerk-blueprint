// Package good holds code that passes the blueprint golangci-lint config.
package good

import (
	"context"
	"fmt"
	"io"
	"net/http"
)

// FetchStatus returns the HTTP status code of url.
func FetchStatus(ctx context.Context, url string) (int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, fmt.Errorf("build request: %w", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, fmt.Errorf("send request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if _, err := io.Copy(io.Discard, resp.Body); err != nil {
		return 0, fmt.Errorf("read body: %w", err)
	}
	return resp.StatusCode, nil
}
