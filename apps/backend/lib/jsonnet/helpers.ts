export default (data, profile) => {
  return `
  local _data = ${JSON.stringify(data || {})};
  local _profile = ${JSON.stringify(profile || {})};
  local nestedFieldFromArray(obj, arr, defaultValue=null) = (
      if std.length(arr) == 0 then
          defaultValue
      else 
        if std.isArray(obj) then 
          if std.length(arr) == 1 then obj[std.parseInt(arr[0])]
          else nestedFieldFromArray(obj[std.parseInt(arr[0])], arr[1:], defaultValue)
        else
          if std.isObject(obj) && std.objectHas(obj, arr[0]) then
            if std.length(arr) == 1 then obj[arr[0]]
              else nestedFieldFromArray(obj[arr[0]], arr[1:], defaultValue)
          else 
              defaultValue
  );      
  local data(path="", defaultValue=null) = 
      nestedFieldFromArray(_data, std.split(path, '.'), defaultValue);
  local profile(path="", defaultValue=null) = 
      nestedFieldFromArray(_profile, std.split(path, '.'), defaultValue);
  local chunk(str="", chunkSize=40) =
    local myStrLen = std.length(str);
    local rangeList = [(i*chunkSize) for i in std.range(0,  std.ceil(myStrLen/chunkSize) - 1)];
    [(str[i:i+chunkSize]) for i in rangeList];`;
};
