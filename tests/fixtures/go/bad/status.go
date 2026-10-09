// Package bad holds seeded issues for the blueprint golangci-lint config.
package bad

import (
	"errors"
	"net/http"
)

// ErrMissing is a sentinel error.
var ErrMissing = errors.New("missing")

// Check has seeded issues. We recieve a request without a context.
func Check(client *http.Client, url string) error {
	req, err := http.NewRequest("GET", url, nil)
	if err == ErrMissing {
		return err
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}
