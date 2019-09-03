var ShaderFrogRuntime = function(e) {
    function r(t) {
        if (a[t]) return a[t].exports;
        var n = a[t] = {
            exports: {},
            id: t,
            loaded: !1
        };
        return e[t].call(n.exports, n, n.exports, r), n.loaded = !0, n.exports
    }
    var a = {};
    return r.m = e, r.c = a, r.p = "", r(0)
}([function(e, r, a) {
    "use strict";

    function t(e) {
        return e && e.__esModule ? e : {
            "default": e
        }
    }

    function n() {}

    function i() {
        var e = arguments.length,
            r = arguments[0];
        if (2 > e) return r;
        for (var a = 1; e > a; a++)
            for (var t = arguments[a], n = Object.keys(t || {}), i = n.length, s = 0; i > s; s++) {
                var o = n[s];
                r[o] = t[o]
            }
        return r
    }

    function s(e) {
        return i({}, e)
    }

    function o(e) {
        var r = s(e),
            a = void 0,
            t = void 0;
        for (a = 0; t = arguments[a++ + 1];) delete r[t];
        return r
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var u = a(1),
        d = t(u);
    n.prototype = {
        mainCamera: null,
        cubeCameras: {},
        reserved: {
            time: null,
            cameraPosition: null
        },
        umap: {
            "float": {
                type: "f",
                value: 0
            },
            "int": {
                type: "i",
                value: 0
            },
            vec2: {
                type: "v2",
                value: function() {
                    return new d.Vector2
                }
            },
            vec3: {
                type: "v3",
                value: function() {
                    return new d.Vector3
                }
            },
            vec4: {
                type: "v4",
                value: function() {
                    return new d.Vector4
                }
            },
            samplerCube: {
                type: "t"
            },
            sampler2D: {
                type: "t"
            }
        },
        getUmap: function(e) {
            var r = this.umap[e].value;
            return "function" == typeof r ? r() : r
        },
        load: function(e, r) {
            var a = this,
                t = e,
                n = "string" == typeof e;
            n && (t = [e]);
            for (var i = new Array(t.length), s = 0, o = function(e, o) {
                    var u = new d.XHRLoader;
                    u.load(o, function(u) {
                        var d = void 0;
                        try {
                            d = JSON.parse(u), delete d.id
                        } catch (m) {
                            throw new Error("Could not parse shader" + o + "! Please verify the URL is correct.")
                        }
                        a.add(d.name, d), i[e] = d, ++s === t.length && r(n ? i[0] : i)
                    })
                }, u = 0; u < t.length; u++) o(u, t[u])
        },
        registerCamera: function(e) {
            if (!(e instanceof d.Camera)) throw new Error("Cannot register a non-camera as a camera!");
            this.mainCamera = e
        },
        registerCubeCamera: function(e, r) {
            if (!r.renderTarget) throw new Error("Cannot register a non-camera as a camera!");
            this.cubeCameras[e] = r
        },
        unregisterCamera: function(e) {
            if (e in this.cubeCameras) delete this.cubeCameras[e];
            else {
                if (e !== this.mainCamera) throw new Error("You never registered camera " + e);
                delete this.mainCamera
            }
        },
        updateSource: function(e, r, a) {
            if (a = a || "name", !this.shaderTypes[e]) throw new Error("Runtime Error: Cannot update shader " + e + " because it has not been added.");
            var t = this.add(e, r),
                n = void 0,
                s = void 0;
            for (s = 0; n = this.runningShaders[s++];) n[a] === e && (i(n.material, o(t, "id")), n.material.needsUpdate = !0)
        },
        renameShader: function(e, r) {
            var a = void 0,
                t = void 0;
            if (!(e in this.shaderTypes)) throw new Error("Could not rename shader " + e + " to " + r + ". It does not exist.");
            for (this.shaderTypes[r] = this.shaderTypes[e], delete this.shaderTypes[e], a = 0; t = this.runningShaders[a++];) t.name === e && (t.name = r)
        },
        get: function(e) {
            var r = this.shaderTypes[e];
            return r.initted || this.create(e), r.material
        },
        add: function(e, r) {
            var a = s(r),
                t = void 0;
            a.fragmentShader = r.fragment, a.vertexShader = r.vertex, delete a.fragment, delete a.vertex;
            for (var n in a.uniforms) t = a.uniforms[n], null === t.value && (a.uniforms[n].value = this.getUmap(t.glslType));
            return e in this.shaderTypes ? i(this.shaderTypes[e], a) : this.shaderTypes[e] = a, a
        },
        create: function(e) {
            var r = this.shaderTypes[e];
            return r.material = new d.RawShaderMaterial(r), this.runningShaders.push(r), r.init && r.init(r.material), r.material.needsUpdate = !0, r.initted = !0, r.material
        },
        updateRuntime: function(e, r, a) {
            a = a || "name";
            var t = void 0,
                n = void 0,
                i = void 0,
                s = void 0;
            for (n = 0; t = this.runningShaders[n++];)
                if (t[a] === e)
                    for (i in r.uniforms) i in this.reserved || i in t.material.uniforms && (s = r.uniforms[i], "t" === s.type && "string" == typeof s.value && (s.value = this.cubeCameras[s.value].renderTarget), t.material.uniforms[i].value = r.uniforms[i].value)
        },
        updateShaders: function(e, r) {
            var a = void 0,
                t = void 0;
            for (r = r || {}, t = 0; a = this.runningShaders[t++];) {
                for (var n in r.uniforms) n in a.material.uniforms && (a.material.uniforms[n].value = r.uniforms[n]);
                "cameraPosition" in a.material.uniforms && this.mainCamera && (a.material.uniforms.cameraPosition.value = this.mainCamera.position.clone()), "viewMatrix" in a.material.uniforms && this.mainCamera && (a.material.uniforms.viewMatrix.value = this.mainCamera.matrixWorldInverse), "time" in a.material.uniforms && (a.material.uniforms.time.value = e)
            }
        },
        shaderTypes: {},
        runningShaders: []
    }, r["default"] = n, e.exports = r["default"]
}, function(e, r) {
    e.exports = THREE
}]);