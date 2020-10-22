const LZString = require('lz-string');
var e = {
	encrypt: function (e) {
		if (e && "string" == typeof e) {
			for (var t = [], i = "", n = Math.floor(128 * Math.random()), a = this.stringToByte(e), o = 0; o < a.length; o++)
				t[o] = ~((a[o] + n) % 256), i += Math.abs(t[o]).toString(16);
			var s = LZString.compressToBase64(i),
				r = s.slice(0, 2) + (16 > n ? "0" + n.toString(16) : n.toString(16)) + s.slice(2);
			return r = encodeURIComponent(r);
		}
	},
	attachEncrypt: function (e) {
		var t = "sq=" + this.encrypt(e);
		return t;
	},
	stringToByte: function (e) {
		for (var t, i = [], n = e.length, a = 0; n > a; a++)
			t = e.charCodeAt(a), t >= 65536 && 1114111 >= t ? (i.push(t >> 18 & 7 | 240), i.push(t >> 12 & 63 | 128), i.push(t >> 6 & 63 | 128), i.push(63 & t | 128)) : t >= 2048 && 65535 >= t ? (i.push(t >> 12 & 15 | 224), i.push(t >> 6 & 63 | 128), i.push(63 & t | 128)) : t >= 128 && 2047 >= t ? (i.push(t >> 6 & 31 | 192), i.push(63 & t | 128)) : i.push(255 & t);
		return i;
	},
	byteToString: function (e) {
		if ("string" == typeof e) return e;
		for (var t = "", i = e, n = 0; n < i.length; n++) {
			var a = i[n].toString(2),
				o = a.match(/^1+?(?=0)/);
			if (o && 8 == a.length) {
				for (var s = o[0].length, r = i[n].toString(2).slice(7 - s), l = 1; s > l; l++) r += i[l + n].toString(2).slice(2);
				t += String.fromCharCode(parseInt(r, 2)), n += s - 1
			} else t += String.fromCharCode(i[n]);
		}
		return t;
	}
};

module.exports = {
	encrypter: e
};
