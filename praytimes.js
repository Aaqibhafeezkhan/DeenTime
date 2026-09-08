function PrayTimes(method) {
    var co = this;

    var timeNames = {
        imsak: 'Imsak',
        fajr: 'Fajr',
        sunrise: 'Sunrise',
        dhuhr: 'Dhuhr',
        asr: 'Asr',
        sunset: 'Sunset',
        maghrib: 'Maghrib',
        isha: 'Isha',
        midnight: 'Midnight'
    };

    var methods = {
        MWL: {
            name: 'Muslim World League',
            params: { fajr: 18, isha: 17 }
        },
        ISNA: {
            name: 'Islamic Society of North America',
            params: { fajr: 15, isha: 15 }
        },
        Egypt: {
            name: 'Egyptian General Authority',
            params: { fajr: 19.5, isha: 17.5 }
        },
        Makkah: {
            name: 'Umm al-Qura University, Makkah',
            params: { fajr: 18.5, isha: '90 min' }
        },
        Karachi: {
            name: 'University of Karachi',
            params: { fajr: 18, isha: 18 }
        },
        Tehran: {
            name: 'Institute of Geophysics, Tehran',
            params: { fajr: 17.5, isha: 14, maghrib: 4.5, midnight: 'Jafari' }
        },
        Jafari: {
            name: 'Shia Ithna-Ashari (Jafari)',
            params: { fajr: 16, isha: 14, maghrib: 4, midnight: 'Jafari' }
        }
    };

    var defParams = {
        maghrib: '0 min',
        midnight: 'Standard'
    };

    var calcMethod = methods[method] ? method : 'MWL';
    var setting = {};
    var offset = {};

    var numIterations = 1;
    var lat, lng, elv, timeZone, jDate;

    for (var i in methods[calcMethod].params) {
        setting[i] = methods[calcMethod].params[i];
    }
    for (var i in defParams) {
        if (typeof setting[i] === 'undefined') {
            setting[i] = defParams[i];
        }
    }

    for (var i in timeNames) {
        offset[i] = 0;
    }

    co.setMethod = function(method) {
        if (methods[method]) {
            calcMethod = method;
            for (var i in methods[method].params) {
                setting[i] = methods[method].params[i];
            }
            for (var i in defParams) {
                if (typeof setting[i] === 'undefined') {
                    setting[i] = defParams[i];
                }
            }
        }
    };

    co.adjust = function(params) {
        for (var id in params) {
            setting[id] = params[id];
        }
    };

    co.tune = function(timeOffsets) {
        for (var i in timeOffsets) {
            offset[i] = timeOffsets[i];
        }
    };

    co.getMethod = function() {
        return calcMethod;
    };

    co.getSetting = function() {
        return setting;
    };

    co.getOffsets = function() {
        return offset;
    };

    co.getDefaults = function() {
        return methods;
    };

    var math = {
        dtr: function(deg) {
            return deg * Math.PI / 180.0;
        },
        rtd: function(rad) {
            return rad * 180.0 / Math.PI;
        },
        sin: function(deg) {
            return Math.sin(this.dtr(deg));
        },
        cos: function(deg) {
            return Math.cos(this.dtr(deg));
        },
        tan: function(deg) {
            return Math.tan(this.dtr(deg));
        },
        arcsin: function(x) {
            return this.rtd(Math.asin(x));
        },
        arccos: function(x) {
            return this.rtd(Math.acos(x));
        },
        arctan: function(x) {
            return this.rtd(Math.atan(x));
        },
        arctan2: function(y, x) {
            return this.rtd(Math.atan2(y, x));
        },
        arccot: function(x) {
            return this.rtd(Math.atan(1 / x));
        },
        fixAngle: function(a) {
            return this.fix(a, 360);
        },
        fixHour: function(a) {
            return this.fix(a, 24);
        },
        fix: function(a, b) {
            a = a - b * (Math.floor(a / b));
            return a < 0 ? a + b : a;
        }
    };

    co.getTimes = function(date, coords, timezone, dst, format) {
        lat = 1 * coords[0];
        lng = 1 * coords[1];
        elv = coords[2] ? 1 * coords[2] : 0;
        timeZone = timezone + (dst ? 1 : 0);
        jDate = julian(date[0], date[1], date[2]) - lng / (15 * 24);

        return computeTimes(format);
    };

    function computeTimes(format) {
        var times = {
            imsak: 5,
            fajr: 5,
            sunrise: 6,
            dhuhr: 12,
            asr: 13,
            sunset: 18,
            maghrib: 18,
            isha: 18
        };

        times = computePrayerTimes(times);
        times = adjustTimes(times);
        times = tuneTimes(times);
        return modifyFormats(times, format);
    }

    function adjustTimes(times) {
        for (var i in times) {
            times[i] += timeZone - lng / 15;
        }

        times.dhuhr += (setting.dhuhr || 0) / 60.0;

        if (typeof setting.maghrib === 'string') {
            var maghribMinutes = parseFloat(setting.maghrib) || 0;
            times.maghrib = times.sunset + maghribMinutes / 60.0;
        }
        if (typeof setting.imsak === 'string') {
            var imsakMinutes = parseFloat(setting.imsak) || 0;
            times.imsak = times.fajr + imsakMinutes / 60.0;
        }

        if (setting.highLats) {
            times = adjustHighLats(times);
        }

        return times;
    }

    function tuneTimes(times) {
        for (var i in times) {
            times[i] += offset[i] / 60;
        }
        return times;
    }

    function modifyFormats(times, format) {
        if (format == 'Float') {
            return times;
        }
        for (var i in times) {
            times[i] = getFormattedTime(times[i], format);
        }
        return times;
    }

    function getFormattedTime(time, format) {
        if (isNaN(time)) {
            return '-----';
        }
        if (format == 'Float') {
            return time;
        }
        time = math.fixHour(time + 0.5 / 60);
        var hours = Math.floor(time);
        var minutes = Math.floor((time - hours) * 60);
        var suffix = format == '12h' ? (hours >= 12 ? ' PM' : ' AM') : '';
        hours = format == '24h' ? hours : ((hours + 12 - 1) % 12 + 1);
        var hrs = hours < 10 ? '0' + hours : hours;
        var mins = minutes < 10 ? '0' + minutes : minutes;
        return hrs + ':' + mins + suffix;
    }

    function computePrayerTimes(times) {
        times = sunPositionTime(jDate, times);
        times = asrTime(math.arccot(setting.asrMethod || 1 + math.tan(math.dtr(lat - sunPosition(jDate).dec)), times.dhuhr), times);
        times = hourAngleTime(setting.fajr, times.fajr, times);
        times = hourAngleTime(setting.isha, times.isha, times);
        times = hourAngleTime(setting.imsak || setting.fajr - 10 / 60.0, times.imsak, times);
        return times;
    }

    function sunPositionTime(jd, times) {
        for (var i in times) {
            times[i] = computeTime(15 * (i == 'dhuhr' ? 0 : i == 'sunrise' || i == 'fajr' || i == 'imsak' ? -1 : 1), jd);
        }
        return times;
    }

    function asrTime(asrFactor, time) {
        var decl = sunPosition(jDate + time).dec;
        var angle = -math.arccot(asrFactor + math.tan(math.dtr(lat - decl)));
        return computeTime(angle, jDate);
    }

    function hourAngleTime(angle, time, times) {
        var decl = sunPosition(jDate + time).dec;
        var angle1 = 90 + angle;
        var angle2 = angle1 + 0.0347 * Math.sqrt(elv);
        var angleFinal = angle2;
        return computeTime(angleFinal, jDate);
    }

    function sunPosition(jd) {
        var D = jd - 2451545.0;
        var g = math.fixAngle(357.529 + 0.98560028 * D);
        var q = math.fixAngle(280.459 + 0.98564736 * D);
        var L = math.fixAngle(q + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g));
        var e = 23.439 - 0.00000036 * D;
        var RA = math.arctan2(math.cos(e) * math.sin(L), math.cos(L)) / 15;
        var eqt = q / 15 - math.fixHour(RA);
        var decl = math.arcsin(math.sin(e) * math.sin(L));
        return { decl: decl, eqt: eqt };
    }

    function computeTime(angle, jd) {
        var sun = sunPosition(jd);
        var eqt = sun.eqt;
        var decl = sun.decl;
        var dh = angle != 0 ? 1 / 15 * math.arccos((-math.sin(angle) - math.sin(decl) * math.sin(lat)) / (math.cos(decl) * math.cos(lat))) : 0;
        return 12 + (angle > 90 || angle < -90 ? -dh : dh) + (lng / 15) - eqt;
    }

    function julian(year, month, day) {
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        var A = Math.floor(year / 100);
        var B = 2 - A + Math.floor(A / 4);
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
    }

    function adjustHighLats(times) {
        var params = { night: math.fixHour(times.sunset - times.sunrise), fajr: setting.fajr, isha: setting.isha };
        var nightTime = math.diff(times.sunset, times.sunrise);
        times.imsak = adjustHLTime(times.imsak, times.sunrise, parseFloat(setting.imsak) || 0, nightTime, 'ccw');
        times.fajr = adjustHLTime(times.fajr, times.sunrise, parseFloat(setting.fajr) || 0, nightTime, 'ccw');
        times.isha = adjustHLTime(times.isha, times.sunset, parseFloat(setting.isha) || 0, nightTime);
        times.maghrib = adjustHLTime(times.maghrib, times.sunset, parseFloat(setting.maghrib) || 0, nightTime);
        return times;
    }

    function adjustHLTime(time, base, angle, night, direction) {
        var portion = nightPortion(angle, night);
        var timeDiff = direction == 'ccw' ? math.diff(time, base) : math.diff(base, time);
        if (isNaN(time) || timeDiff > portion) {
            time = base + (direction == 'ccw' ? -portion : portion);
        }
        return time;
    }

    function nightPortion(angle, night) {
        var method = setting.highLats;
        var portion = 1 / 60.0 * angle;
        if (method == 'AngleBased') {
            portion = 1 / 60.0 * angle;
        }
        if (method == 'OneSeventh') {
            portion = 1 / 7.0;
        }
        if (method == 'NightMiddle') {
            portion = 1 / 2.0;
        }
        return portion * night;
    }

    math.diff = function(a, b) {
        return math.fixHour(a - b);
    };

    co.getMethods = function() {
        return methods;
    };
}
