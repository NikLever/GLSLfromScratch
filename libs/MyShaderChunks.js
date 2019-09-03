THREE.ShaderChunk.simple_lambert_vertex = `
	#include <beginnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <project_vertex>
	#include <lights_lambert_vertex>
`

THREE.ShaderChunk.lambert_common_vertex = `
	#define LAMBERT

	varying vec3 vLightFront;
	varying vec3 vIndirectFront;

	#ifdef DOUBLE_SIDED
		varying vec3 vLightBack;
		varying vec3 vIndirectBack;
	#endif

	#include <common>
	#include <uv_pars_vertex>
	#include <uv2_pars_vertex>
	#include <envmap_pars_vertex>
	#include <bsdfs>
	#include <lights_pars_begin>
	#include <color_pars_vertex>
	#include <fog_pars_vertex>
	#include <morphtarget_pars_vertex>
	#include <skinning_pars_vertex>
	#include <shadowmap_pars_vertex>
	#include <logdepthbuf_pars_vertex>
	#include <clipping_planes_pars_vertex>
`

THREE.ShaderChunk.lambert_main_vertex = `
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <lights_lambert_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
`

THREE.ShaderChunk.noise = `
	//
	// Description : Array and textureless GLSL 2D/3D/4D simplex 
	//               noise functions.
	//      Author : Ian McEwan, Ashima Arts.
	//  Maintainer : stegu
	//     Lastmod : 20110822 (ijm)
	//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
	//               Distributed under the MIT License. See LICENSE file.
	//               https://github.com/ashima/webgl-noise
	//               https://github.com/stegu/webgl-noise
	// 

	vec3 mod289(vec3 x) {
	  return x - floor(x * (1.0 / 289.0)) * 289.0;
	}

	vec4 mod289(vec4 x) {
	  return x - floor(x * (1.0 / 289.0)) * 289.0;
	}

	vec4 permute(vec4 x) {
		 return mod289(((x*34.0)+1.0)*x);
	}

	// Permutation polynomial (ring size 289 = 17*17)
	vec3 permute(vec3 x) {
	  return mod289(((x*34.0)+1.0)*x);
	}
	
	float permute(float x){
		return x - floor(x * (1.0 / 289.0)) * 289.0;;
	}

	vec4 taylorInvSqrt(vec4 r){
	  return 1.79284291400159 - 0.85373472095314 * r;
	}

	vec2 fade(vec2 t) {
	  return t*t*t*(t*(t*6.0-15.0)+10.0);
	}

	vec3 fade(vec3 t) {
	  return t*t*t*(t*(t*6.0-15.0)+10.0);
	}
	
	// Hashed 2-D gradients with an extra rotation.
	// (The constant 0.0243902439 is 1/41)
	vec2 rgrad2(vec2 p, float rot) {
	#if 0
	// Map from a line to a diamond such that a shift maps to a rotation.
	  float u = permute(permute(p.x) + p.y) * 0.0243902439 + rot; // Rotate by shift
	  u = 4.0 * fract(u) - 2.0;
	  // (This vector could be normalized, exactly or approximately.)
	  return vec2(abs(u)-1.0, abs(abs(u+1.0)-2.0)-1.0);
	#else
	// For more isotropic gradients, sin/cos can be used instead.
	  float u = permute(permute(p.x) + p.y) * 0.0243902439 + rot; // Rotate by shift
	  u = fract(u) * 6.28318530718; // 2*pi
	  return vec2(cos(u), sin(u));
	#endif
	}

	float snoise(vec3 v){ 
	  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
	  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

	// First corner
	  vec3 i  = floor(v + dot(v, C.yyy) );
	  vec3 x0 =   v - i + dot(i, C.xxx) ;

	// Other corners
	  vec3 g = step(x0.yzx, x0.xyz);
	  vec3 l = 1.0 - g;
	  vec3 i1 = min( g.xyz, l.zxy );
	  vec3 i2 = max( g.xyz, l.zxy );

	  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
	  //   x1 = x0 - i1  + 1.0 * C.xxx;
	  //   x2 = x0 - i2  + 2.0 * C.xxx;
	  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
	  vec3 x1 = x0 - i1 + C.xxx;
	  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
	  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

	// Permutations
	  i = mod289(i); 
	  vec4 p = permute( permute( permute( 
				 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
			   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
			   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

	// Gradients: 7x7 points over a square, mapped onto an octahedron.
	// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
	  float n_ = 0.142857142857; // 1.0/7.0
	  vec3  ns = n_ * D.wyz - D.xzx;

	  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

	  vec4 x_ = floor(j * ns.z);
	  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

	  vec4 x = x_ *ns.x + ns.yyyy;
	  vec4 y = y_ *ns.x + ns.yyyy;
	  vec4 h = 1.0 - abs(x) - abs(y);

	  vec4 b0 = vec4( x.xy, y.xy );
	  vec4 b1 = vec4( x.zw, y.zw );

	  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
	  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
	  vec4 s0 = floor(b0)*2.0 + 1.0;
	  vec4 s1 = floor(b1)*2.0 + 1.0;
	  vec4 sh = -step(h, vec4(0.0));

	  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
	  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

	  vec3 p0 = vec3(a0.xy,h.x);
	  vec3 p1 = vec3(a0.zw,h.y);
	  vec3 p2 = vec3(a1.xy,h.z);
	  vec3 p3 = vec3(a1.zw,h.w);

	//Normalise gradients
	  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	  p0 *= norm.x;
	  p1 *= norm.y;
	  p2 *= norm.z;
	  p3 *= norm.w;

	// Mix final noise value
	  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	  m = m * m;
	  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
									dot(p2,x2), dot(p3,x3) ) );
	  }

	// Classic Perlin noise
	float cnoise(vec2 P){
	  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
	  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
	  Pi = mod289(Pi); // To avoid truncation effects in permutation
	  vec4 ix = Pi.xzxz;
	  vec4 iy = Pi.yyww;
	  vec4 fx = Pf.xzxz;
	  vec4 fy = Pf.yyww;

	  vec4 i = permute(permute(ix) + iy);

	  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
	  vec4 gy = abs(gx) - 0.5 ;
	  vec4 tx = floor(gx + 0.5);
	  gx = gx - tx;

	  vec2 g00 = vec2(gx.x,gy.x);
	  vec2 g10 = vec2(gx.y,gy.y);
	  vec2 g01 = vec2(gx.z,gy.z);
	  vec2 g11 = vec2(gx.w,gy.w);

	  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
	  g00 *= norm.x;  
	  g01 *= norm.y;  
	  g10 *= norm.z;  
	  g11 *= norm.w;  

	  float n00 = dot(g00, vec2(fx.x, fy.x));
	  float n10 = dot(g10, vec2(fx.y, fy.y));
	  float n01 = dot(g01, vec2(fx.z, fy.z));
	  float n11 = dot(g11, vec2(fx.w, fy.w));

	  vec2 fade_xy = fade(Pf.xy);
	  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
	  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
	  return 2.3 * n_xy;
	}

	// Classic Perlin noise, periodic variant
	float pnoise(vec2 P, vec2 rep){
	  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
	  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
	  Pi = mod(Pi, rep.xyxy); // To create noise with explicit period
	  Pi = mod289(Pi);        // To avoid truncation effects in permutation
	  vec4 ix = Pi.xzxz;
	  vec4 iy = Pi.yyww;
	  vec4 fx = Pf.xzxz;
	  vec4 fy = Pf.yyww;

	  vec4 i = permute(permute(ix) + iy);

	  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
	  vec4 gy = abs(gx) - 0.5 ;
	  vec4 tx = floor(gx + 0.5);
	  gx = gx - tx;

	  vec2 g00 = vec2(gx.x,gy.x);
	  vec2 g10 = vec2(gx.y,gy.y);
	  vec2 g01 = vec2(gx.z,gy.z);
	  vec2 g11 = vec2(gx.w,gy.w);

	  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
	  g00 *= norm.x;  
	  g01 *= norm.y;  
	  g10 *= norm.z;  
	  g11 *= norm.w;  

	  float n00 = dot(g00, vec2(fx.x, fy.x));
	  float n10 = dot(g10, vec2(fx.y, fy.y));
	  float n01 = dot(g01, vec2(fx.z, fy.z));
	  float n11 = dot(g11, vec2(fx.w, fy.w));

	  vec2 fade_xy = fade(Pf.xy);
	  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
	  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
	  return 2.3 * n_xy;
	}
	// Classic Perlin noise
	float cnoise(vec3 P)
	{
	  vec3 Pi0 = floor(P); // Integer part for indexing
	  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
	  Pi0 = mod289(Pi0);
	  Pi1 = mod289(Pi1);
	  vec3 Pf0 = fract(P); // Fractional part for interpolation
	  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
	  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
	  vec4 iy = vec4(Pi0.yy, Pi1.yy);
	  vec4 iz0 = Pi0.zzzz;
	  vec4 iz1 = Pi1.zzzz;

	  vec4 ixy = permute(permute(ix) + iy);
	  vec4 ixy0 = permute(ixy + iz0);
	  vec4 ixy1 = permute(ixy + iz1);

	  vec4 gx0 = ixy0 * (1.0 / 7.0);
	  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
	  gx0 = fract(gx0);
	  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
	  vec4 sz0 = step(gz0, vec4(0.0));
	  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
	  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

	  vec4 gx1 = ixy1 * (1.0 / 7.0);
	  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
	  gx1 = fract(gx1);
	  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
	  vec4 sz1 = step(gz1, vec4(0.0));
	  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
	  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

	  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
	  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
	  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
	  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
	  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
	  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
	  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
	  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

	  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
	  g000 *= norm0.x;
	  g010 *= norm0.y;
	  g100 *= norm0.z;
	  g110 *= norm0.w;
	  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
	  g001 *= norm1.x;
	  g011 *= norm1.y;
	  g101 *= norm1.z;
	  g111 *= norm1.w;

	  float n000 = dot(g000, Pf0);
	  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
	  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
	  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
	  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
	  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
	  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
	  float n111 = dot(g111, Pf1);

	  vec3 fade_xyz = fade(Pf0);
	  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
	  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
	  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
	  return 2.2 * n_xyz;
	}

	// Classic Perlin noise, periodic variant
	float pnoise(vec3 P, vec3 rep)
	{
	  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
	  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
	  Pi0 = mod289(Pi0);
	  Pi1 = mod289(Pi1);
	  vec3 Pf0 = fract(P); // Fractional part for interpolation
	  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
	  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
	  vec4 iy = vec4(Pi0.yy, Pi1.yy);
	  vec4 iz0 = Pi0.zzzz;
	  vec4 iz1 = Pi1.zzzz;

	  vec4 ixy = permute(permute(ix) + iy);
	  vec4 ixy0 = permute(ixy + iz0);
	  vec4 ixy1 = permute(ixy + iz1);

	  vec4 gx0 = ixy0 * (1.0 / 7.0);
	  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
	  gx0 = fract(gx0);
	  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
	  vec4 sz0 = step(gz0, vec4(0.0));
	  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
	  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

	  vec4 gx1 = ixy1 * (1.0 / 7.0);
	  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
	  gx1 = fract(gx1);
	  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
	  vec4 sz1 = step(gz1, vec4(0.0));
	  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
	  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

	  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
	  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
	  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
	  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
	  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
	  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
	  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
	  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

	  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
	  g000 *= norm0.x;
	  g010 *= norm0.y;
	  g100 *= norm0.z;
	  g110 *= norm0.w;
	  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
	  g001 *= norm1.x;
	  g011 *= norm1.y;
	  g101 *= norm1.z;
	  g111 *= norm1.w;

	  float n000 = dot(g000, Pf0);
	  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
	  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
	  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
	  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
	  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
	  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
	  float n111 = dot(g111, Pf1);

	  vec3 fade_xyz = fade(Pf0);
	  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
	  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
	  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
	  return 2.2 * n_xyz;
	}
	
	float turbulence( vec3 p ) {
	  float w = 100.0;
	  float t = -.5;

	  for (float f = 1.0 ; f <= 10.0 ; f++ ){
		float power = pow( 2.0, f );
		t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
	  }

	  return t;
	}
	
	float turbulence3( vec3 p ) {
	  float w = 100.0;
	  float t = -.5;

	  for (float f = 1.0 ; f <= 3.0 ; f++ ){
		float power = pow( 2.0, f );
		t += abs( pnoise( vec3( power * p ), vec3( 3.0, 3.0, 3.0 ) ) / power );
	  }

	  return t;
	}
	
	float turbulence6( vec3 p ) {
	  float w = 100.0;
	  float t = -.5;

	  for (float f = 1.0 ; f <= 6.0 ; f++ ){
		float power = pow( 2.0, f );
		t += abs( pnoise( vec3( power * p ), vec3( 6.0, 6.0, 6.0 ) ) / power );
	  }

	  return t;
	}
	
	//
	// 2-D tiling simplex noise with rotating gradients and analytical derivative.
	// The first component of the 3-element return vector is the noise value,
	// and the second and third components are the x and y partial derivatives.
	//
	vec3 psrdnoise(vec2 pos, vec2 per, float rot) {
	  // Hack: offset y slightly to hide some rare artifacts
	  pos.y += 0.01;
	  // Skew to hexagonal grid
	  vec2 uv = vec2(pos.x + pos.y*0.5, pos.y);
  
	  vec2 i0 = floor(uv);
	  vec2 f0 = fract(uv);
	  // Traversal order
	  vec2 i1 = (f0.x > f0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

	  // Unskewed grid points in (x,y) space
	  vec2 p0 = vec2(i0.x - i0.y * 0.5, i0.y);
	  vec2 p1 = vec2(p0.x + i1.x - i1.y * 0.5, p0.y + i1.y);
	  vec2 p2 = vec2(p0.x + 0.5, p0.y + 1.0);

	  // Integer grid point indices in (u,v) space
	  i1 = i0 + i1;
	  vec2 i2 = i0 + vec2(1.0, 1.0);

	  // Vectors in unskewed (x,y) coordinates from
	  // each of the simplex corners to the evaluation point
	  vec2 d0 = pos - p0;
	  vec2 d1 = pos - p1;
	  vec2 d2 = pos - p2;

	  // Wrap i0, i1 and i2 to the desired period before gradient hashing:
	  // wrap points in (x,y), map to (u,v)
	  vec3 xw = mod(vec3(p0.x, p1.x, p2.x), per.x);
	  vec3 yw = mod(vec3(p0.y, p1.y, p2.y), per.y);
	  vec3 iuw = xw + 0.5 * yw;
	  vec3 ivw = yw;
  
	  // Create gradients from indices
	  vec2 g0 = rgrad2(vec2(iuw.x, ivw.x), rot);
	  vec2 g1 = rgrad2(vec2(iuw.y, ivw.y), rot);
	  vec2 g2 = rgrad2(vec2(iuw.z, ivw.z), rot);

	  // Gradients dot vectors to corresponding corners
	  // (The derivatives of this are simply the gradients)
	  vec3 w = vec3(dot(g0, d0), dot(g1, d1), dot(g2, d2));
  
	  // Radial weights from corners
	  // 0.8 is the square of 2/sqrt(5), the distance from
	  // a grid point to the nearest simplex boundary
	  vec3 t = 0.8 - vec3(dot(d0, d0), dot(d1, d1), dot(d2, d2));

	  // Partial derivatives for analytical gradient computation
	  vec3 dtdx = -2.0 * vec3(d0.x, d1.x, d2.x);
	  vec3 dtdy = -2.0 * vec3(d0.y, d1.y, d2.y);

	  // Set influence of each surflet to zero outside radius sqrt(0.8)
	  if (t.x < 0.0) {
		dtdx.x = 0.0;
		dtdy.x = 0.0;
		t.x = 0.0;
	  }
	  if (t.y < 0.0) {
		dtdx.y = 0.0;
		dtdy.y = 0.0;
		t.y = 0.0;
	  }
	  if (t.z < 0.0) {
		dtdx.z = 0.0;
		dtdy.z = 0.0;
		t.z = 0.0;
	  }

	  // Fourth power of t (and third power for derivative)
	  vec3 t2 = t * t;
	  vec3 t4 = t2 * t2;
	  vec3 t3 = t2 * t;
  
	  // Final noise value is:
	  // sum of ((radial weights) times (gradient dot vector from corner))
	  float n = dot(t4, w);
  
	  // Final analytical derivative (gradient of a sum of scalar products)
	  vec2 dt0 = vec2(dtdx.x, dtdy.x) * 4.0 * t3.x;
	  vec2 dn0 = t4.x * g0 + dt0 * w.x;
	  vec2 dt1 = vec2(dtdx.y, dtdy.y) * 4.0 * t3.y;
	  vec2 dn1 = t4.y * g1 + dt1 * w.y;
	  vec2 dt2 = vec2(dtdx.z, dtdy.z) * 4.0 * t3.z;
	  vec2 dn2 = t4.z * g2 + dt2 * w.z;

	  return 11.0*vec3(n, dn0 + dn1 + dn2);
	}

	//
	// 2-D tiling simplex noise with fixed gradients
	// and analytical derivative.
	// This function is implemented as a wrapper to "psrdnoise",
	// at the minimal cost of three extra additions.
	//
	vec3 psdnoise(vec2 pos, vec2 per) {
	  return psrdnoise(pos, per, 0.0);
	}

	//
	// 2-D tiling simplex noise with rotating gradients,
	// but without the analytical derivative.
	//
	float psrnoise(vec2 pos, vec2 per, float rot) {
	  // Offset y slightly to hide some rare artifacts
	  pos.y += 0.001;
	  // Skew to hexagonal grid
	  vec2 uv = vec2(pos.x + pos.y*0.5, pos.y);
  
	  vec2 i0 = floor(uv);
	  vec2 f0 = fract(uv);
	  // Traversal order
	  vec2 i1 = (f0.x > f0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

	  // Unskewed grid points in (x,y) space
	  vec2 p0 = vec2(i0.x - i0.y * 0.5, i0.y);
	  vec2 p1 = vec2(p0.x + i1.x - i1.y * 0.5, p0.y + i1.y);
	  vec2 p2 = vec2(p0.x + 0.5, p0.y + 1.0);

	  // Integer grid point indices in (u,v) space
	  i1 = i0 + i1;
	  vec2 i2 = i0 + vec2(1.0, 1.0);

	  // Vectors in unskewed (x,y) coordinates from
	  // each of the simplex corners to the evaluation point
	  vec2 d0 = pos - p0;
	  vec2 d1 = pos - p1;
	  vec2 d2 = pos - p2;

	  // Wrap i0, i1 and i2 to the desired period before gradient hashing:
	  // wrap points in (x,y), map to (u,v)
	  vec3 xw = mod(vec3(p0.x, p1.x, p2.x), per.x);
	  vec3 yw = mod(vec3(p0.y, p1.y, p2.y), per.y);
	  vec3 iuw = xw + 0.5 * yw;
	  vec3 ivw = yw;
  
	  // Create gradients from indices
	  vec2 g0 = rgrad2(vec2(iuw.x, ivw.x), rot);
	  vec2 g1 = rgrad2(vec2(iuw.y, ivw.y), rot);
	  vec2 g2 = rgrad2(vec2(iuw.z, ivw.z), rot);

	  // Gradients dot vectors to corresponding corners
	  // (The derivatives of this are simply the gradients)
	  vec3 w = vec3(dot(g0, d0), dot(g1, d1), dot(g2, d2));
  
	  // Radial weights from corners
	  // 0.8 is the square of 2/sqrt(5), the distance from
	  // a grid point to the nearest simplex boundary
	  vec3 t = 0.8 - vec3(dot(d0, d0), dot(d1, d1), dot(d2, d2));

	  // Set influence of each surflet to zero outside radius sqrt(0.8)
	  t = max(t, 0.0);

	  // Fourth power of t
	  vec3 t2 = t * t;
	  vec3 t4 = t2 * t2;
  
	  // Final noise value is:
	  // sum of ((radial weights) times (gradient dot vector from corner))
	  float n = dot(t4, w);
  
	  // Rescale to cover the range [-1,1] reasonably well
	  return 11.0*n;
	}

	//
	// 2-D tiling simplex noise with fixed gradients,
	// without the analytical derivative.
	// This function is implemented as a wrapper to "psrnoise",
	// at the minimal cost of three extra additions.
	//
	float psnoise(vec2 pos, vec2 per) {
	  return psrnoise(pos, per, 0.0);
	}

	//
	// 2-D non-tiling simplex noise with rotating gradients and analytical derivative.
	// The first component of the 3-element return vector is the noise value,
	// and the second and third components are the x and y partial derivatives.
	//
	vec3 srdnoise(vec2 pos, float rot) {
	  // Offset y slightly to hide some rare artifacts
	  pos.y += 0.001;
	  // Skew to hexagonal grid
	  vec2 uv = vec2(pos.x + pos.y*0.5, pos.y);
  
	  vec2 i0 = floor(uv);
	  vec2 f0 = fract(uv);
	  // Traversal order
	  vec2 i1 = (f0.x > f0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

	  // Unskewed grid points in (x,y) space
	  vec2 p0 = vec2(i0.x - i0.y * 0.5, i0.y);
	  vec2 p1 = vec2(p0.x + i1.x - i1.y * 0.5, p0.y + i1.y);
	  vec2 p2 = vec2(p0.x + 0.5, p0.y + 1.0);

	  // Integer grid point indices in (u,v) space
	  i1 = i0 + i1;
	  vec2 i2 = i0 + vec2(1.0, 1.0);

	  // Vectors in unskewed (x,y) coordinates from
	  // each of the simplex corners to the evaluation point
	  vec2 d0 = pos - p0;
	  vec2 d1 = pos - p1;
	  vec2 d2 = pos - p2;

	  vec3 x = vec3(p0.x, p1.x, p2.x);
	  vec3 y = vec3(p0.y, p1.y, p2.y);
	  vec3 iuw = x + 0.5 * y;
	  vec3 ivw = y;
  
	  // Avoid precision issues in permutation
	  iuw = mod289(iuw);
	  ivw = mod289(ivw);

	  // Create gradients from indices
	  vec2 g0 = rgrad2(vec2(iuw.x, ivw.x), rot);
	  vec2 g1 = rgrad2(vec2(iuw.y, ivw.y), rot);
	  vec2 g2 = rgrad2(vec2(iuw.z, ivw.z), rot);

	  // Gradients dot vectors to corresponding corners
	  // (The derivatives of this are simply the gradients)
	  vec3 w = vec3(dot(g0, d0), dot(g1, d1), dot(g2, d2));
  
	  // Radial weights from corners
	  // 0.8 is the square of 2/sqrt(5), the distance from
	  // a grid point to the nearest simplex boundary
	  vec3 t = 0.8 - vec3(dot(d0, d0), dot(d1, d1), dot(d2, d2));

	  // Partial derivatives for analytical gradient computation
	  vec3 dtdx = -2.0 * vec3(d0.x, d1.x, d2.x);
	  vec3 dtdy = -2.0 * vec3(d0.y, d1.y, d2.y);

	  // Set influence of each surflet to zero outside radius sqrt(0.8)
	  if (t.x < 0.0) {
		dtdx.x = 0.0;
		dtdy.x = 0.0;
		t.x = 0.0;
	  }
	  if (t.y < 0.0) {
		dtdx.y = 0.0;
		dtdy.y = 0.0;
		t.y = 0.0;
	  }
	  if (t.z < 0.0) {
		dtdx.z = 0.0;
		dtdy.z = 0.0;
		t.z = 0.0;
	  }

	  // Fourth power of t (and third power for derivative)
	  vec3 t2 = t * t;
	  vec3 t4 = t2 * t2;
	  vec3 t3 = t2 * t;
  
	  // Final noise value is:
	  // sum of ((radial weights) times (gradient dot vector from corner))
	  float n = dot(t4, w);
  
	  // Final analytical derivative (gradient of a sum of scalar products)
	  vec2 dt0 = vec2(dtdx.x, dtdy.x) * 4.0 * t3.x;
	  vec2 dn0 = t4.x * g0 + dt0 * w.x;
	  vec2 dt1 = vec2(dtdx.y, dtdy.y) * 4.0 * t3.y;
	  vec2 dn1 = t4.y * g1 + dt1 * w.y;
	  vec2 dt2 = vec2(dtdx.z, dtdy.z) * 4.0 * t3.z;
	  vec2 dn2 = t4.z * g2 + dt2 * w.z;

	  return 11.0*vec3(n, dn0 + dn1 + dn2);
	}

	//
	// 2-D non-tiling simplex noise with fixed gradients and analytical derivative.
	// This function is implemented as a wrapper to "srdnoise",
	// at the minimal cost of three extra additions.
	//
	vec3 sdnoise(vec2 pos) {
	  return srdnoise(pos, 0.0);
	}

	//
	// 2-D non-tiling simplex noise with rotating gradients,
	// without the analytical derivative.
	//
	float srnoise(vec2 pos, float rot) {
	  // Offset y slightly to hide some rare artifacts
	  pos.y += 0.001;
	  // Skew to hexagonal grid
	  vec2 uv = vec2(pos.x + pos.y*0.5, pos.y);
  
	  vec2 i0 = floor(uv);
	  vec2 f0 = fract(uv);
	  // Traversal order
	  vec2 i1 = (f0.x > f0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

	  // Unskewed grid points in (x,y) space
	  vec2 p0 = vec2(i0.x - i0.y * 0.5, i0.y);
	  vec2 p1 = vec2(p0.x + i1.x - i1.y * 0.5, p0.y + i1.y);
	  vec2 p2 = vec2(p0.x + 0.5, p0.y + 1.0);

	  // Integer grid point indices in (u,v) space
	  i1 = i0 + i1;
	  vec2 i2 = i0 + vec2(1.0, 1.0);

	  // Vectors in unskewed (x,y) coordinates from
	  // each of the simplex corners to the evaluation point
	  vec2 d0 = pos - p0;
	  vec2 d1 = pos - p1;
	  vec2 d2 = pos - p2;

	  // Wrap i0, i1 and i2 to the desired period before gradient hashing:
	  // wrap points in (x,y), map to (u,v)
	  vec3 x = vec3(p0.x, p1.x, p2.x);
	  vec3 y = vec3(p0.y, p1.y, p2.y);
	  vec3 iuw = x + 0.5 * y;
	  vec3 ivw = y;
  
	  // Avoid precision issues in permutation
	  iuw = mod289(iuw);
	  ivw = mod289(ivw);

	  // Create gradients from indices
	  vec2 g0 = rgrad2(vec2(iuw.x, ivw.x), rot);
	  vec2 g1 = rgrad2(vec2(iuw.y, ivw.y), rot);
	  vec2 g2 = rgrad2(vec2(iuw.z, ivw.z), rot);

	  // Gradients dot vectors to corresponding corners
	  // (The derivatives of this are simply the gradients)
	  vec3 w = vec3(dot(g0, d0), dot(g1, d1), dot(g2, d2));
  
	  // Radial weights from corners
	  // 0.8 is the square of 2/sqrt(5), the distance from
	  // a grid point to the nearest simplex boundary
	  vec3 t = 0.8 - vec3(dot(d0, d0), dot(d1, d1), dot(d2, d2));

	  // Set influence of each surflet to zero outside radius sqrt(0.8)
	  t = max(t, 0.0);

	  // Fourth power of t
	  vec3 t2 = t * t;
	  vec3 t4 = t2 * t2;
  
	  // Final noise value is:
	  // sum of ((radial weights) times (gradient dot vector from corner))
	  float n = dot(t4, w);
  
	  // Rescale to cover the range [-1,1] reasonably well
	  return 11.0*n;
	}

	//
	// 2-D non-tiling simplex noise with fixed gradients,
	// without the analytical derivative.
	// This function is implemented as a wrapper to "srnoise",
	// at the minimal cost of three extra additions.
	// Note: if this kind of noise is all you want, there are faster
	// GLSL implementations of non-tiling simplex noise out there.
	// This one is included mainly for completeness and compatibility
	// with the other functions in the file.
	//
	float snoise(vec2 pos) {
	  return srnoise(pos, 0.0);
	}

	float hash(float x, float y) {
		return fract(abs(sin(sin(123.321 + x) * (y + 321.123)) * 456.654));
	}
	
	float lerp(float a, float b, float t) {
		return a * (1.0 - t) + b * t;
	}

	float perlin(float x, float y){
		float col = 0.0;
		for (int i = 0; i < 8; i++) 
		{
			float fx = floor(x);
			float fy = floor(y);
			float cx = ceil(x);
			float cy = ceil(y);
			float a = hash(fx, fy);
			float b = hash(fx, cy);
			float c = hash(cx, fy);
			float d = hash(cx, cy);
			col += lerp(lerp(a, b, fract(y)), lerp(c, d, fract(y)), fract(x));
			col /= 2.0;
			x /= 2.0;
			y /= 2.0;
		}
		return col;
	}
	
	float dperlin(float x, float y){
		float d = perlin(x, y) * 800.0;
		return perlin(x + d, y + d);
	}
	
	float ddperlin(float x, float y){
		float d = perlin(x, y) * 800.0;
		return dperlin(x + d, y + d);
	}
`
