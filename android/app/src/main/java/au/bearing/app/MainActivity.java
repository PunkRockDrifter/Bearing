package au.bearing.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Bearing for Android: a WebView around the bundled web app.
 *
 * The web files ship inside the APK (assets/www) and are served from
 * https://appassets.androidplatform.net, a domain reserved for exactly this,
 * so the page runs as a normal secure website: local storage, clipboard and
 * network requests all behave as they do in Chrome. Everything works offline.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/www/index.html";

    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        web.addJavascriptInterface(new Bridge(), "BearingNative");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                return HOST.equals(u.getHost()) ? asset(u.getPath()) : null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                // SEEK, course searches and other outside links open in the phone's browser.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });

        String link = linkTarget(getIntent());
        if (link != null) web.loadUrl(link);
        else if (state != null) web.restoreState(state);
        else web.loadUrl(START);
    }

    /** An https link to our own site (invite, friend reply, results) becomes the same query on the bundled page. */
    private String linkTarget(Intent intent) {
        Uri d = intent == null ? null : intent.getData();
        if (d == null) return null;
        boolean ours = "bearing".equals(d.getScheme()) || ("https".equals(d.getScheme()) && !HOST.equals(d.getHost()));
        if (!ours) return null;
        String q = d.getEncodedQuery();
        return q == null ? START : START + "?" + q;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String link = linkTarget(intent);
        if (link != null) web.loadUrl(link);
    }

    private WebResourceResponse asset(String path) {
        if (path == null || path.equals("/") || path.equals("/www/")) path = "/www/index.html";
        String p = path.startsWith("/") ? path.substring(1) : path;
        try {
            InputStream in = getAssets().open(p);
            return new WebResourceResponse(mime(p), "utf-8", in);
        } catch (IOException e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null,
                    new ByteArrayInputStream(new byte[0]));
        }
    }

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json") || p.endsWith(".webmanifest")) return "application/json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // Let the page step back a screen first; leave the app only when it has nowhere to go.
        web.evaluateJavascript("(window.bearingBack ? bearingBack() : false)", result -> {
            if (!"true".equals(result)) finish();
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    /** Small bridge so the page can use the Android share sheet and clipboard. */
    private class Bridge {
        @JavascriptInterface
        public void share(String title, String text) {
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_SUBJECT, title);
                send.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(send, title));
            });
        }

        /** Shares the results snapshot (a base64 PNG drawn by the page) with a caption. */
        @JavascriptInterface
        public void shareImage(String pngBase64, String title, String text) {
            try {
                File f = ShareProvider.file(getCacheDir());
                f.getParentFile().mkdirs();
                try (FileOutputStream out = new FileOutputStream(f)) {
                    out.write(Base64.decode(pngBase64, Base64.DEFAULT));
                }
            } catch (IOException | IllegalArgumentException e) {
                share(title, text);
                return;
            }
            Uri uri = Uri.parse("content://" + ShareProvider.AUTHORITY + "/" + ShareProvider.NAME);
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("image/png");
                send.putExtra(Intent.EXTRA_STREAM, uri);
                send.putExtra(Intent.EXTRA_SUBJECT, title);
                send.putExtra(Intent.EXTRA_TEXT, text);
                send.setClipData(ClipData.newRawUri(title, uri));
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(send, title));
            });
        }

        /** Matches the phone's status and navigation bars to the app's light or dark choice. */
        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public void setBars(boolean dark) {
            runOnUiThread(() -> {
                int ground = dark ? 0xFF121A15 : 0xFFE8EBE3;
                Window w = getWindow();
                w.setStatusBarColor(ground);
                w.setNavigationBarColor(ground);
                web.setBackgroundColor(ground);
                View decor = w.getDecorView();
                int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= 26) light |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                int flags = decor.getSystemUiVisibility();
                decor.setSystemUiVisibility(dark ? (flags & ~light) : (flags | light));
            });
        }

        @JavascriptInterface
        public void copy(String text) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Bearing", text));
            });
        }
    }
}
