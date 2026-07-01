#!/bin/bash
progname="${0##*/}"
progname="${progname%.sh}"
 
# usage: check_elf_alignment.sh [path to *.so files|path to *.apk]
 
cleanup_trap() {
  if [ -n "${tmp}" -a -d "${tmp}" ]; then
    rm -rf ${tmp}
  fi
  exit $1
}
 
usage() {
  echo "Host side script to check the ELF alignment of shared libraries."
  echo "Shared libraries are reported ALIGNED when their ELF regions are"
  echo "16 KB or 64 KB aligned. Otherwise they are reported as UNALIGNED."
  echo
  echo "Usage: ${progname} [input-path|input-APK|input-APEX]"
}
 
if [ ${#} -ne 1 ]; then
  usage
  exit
fi
 
case ${1} in
  --help | -h | -\?)
    usage
    exit
    ;;
  *)
    dir="${1}"
    ;;
esac
 
if ! [ -f "${dir}" -o -d "${dir}" ]; then
  echo "Invalid file: ${dir}" >&2
  exit 1
fi
 
RED="\e[31m"
GREEN="\e[32m"
ENDCOLOR="\e[0m"
 
# --- APK/APEX extraction ---
if [[ "${dir}" == *.apk ]]; then
  trap 'cleanup_trap' EXIT
  echo
  echo "Recursively analyzing $dir"
  echo
 
  if { zipalign --help 2>&1 | grep -q "\-P <pagesize_kb>"; }; then
    echo "=== APK zip-alignment ==="
    zipalign -v -c -P 16 4 "${dir}" | egrep 'lib/arm64-v8a|lib/x86_64|Verification'
    echo "========================="
  else
    echo "NOTICE: Zip alignment check requires build-tools version 35.0.0-rc3 or higher."
    echo "Install with: sdkmanager \"build-tools;35.0.0-rc3\""
  fi
 
  dir_filename=$(basename "${dir}")
  tmp=$(mktemp -d -t "${dir_filename%.apk}_out_XXXXX")
  unzip "${dir}" "lib/*" -d "${tmp}" >/dev/null 2>&1
  dir="${tmp}/lib"
fi
 
if [[ "${dir}" == *.apex ]]; then
  trap 'cleanup_trap' EXIT
  dir_filename=$(basename "${dir}")
  tmp=$(mktemp -d -t "${dir}_out_XXXXX")
  deapexer extract "${dir}" "${tmp}" || { echo "Failed to deapex." && exit 1; }
  dir="${tmp}"
fi
# --- End APK/APEX extraction ---
 
unaligned_libs=()
 
echo
echo "=== ELF Alignment Check ==="
printf "%-100s %-20s %s\n" "FILE PATH" "STATUS" "ALIGNMENT VALUE (bytes)"
printf "%-100s %-20s %s\n" "----------------------------------------------------------------------------------------------------" "--------------------" "-----------------------"
 
declare -a ABIS=("arm64-v8a" "armeabi-v7a" "x86_64" "x86" "armeabi")
 
for abi in "${ABIS[@]}"; do
  abi_path="${dir}/${abi}"
  if [ -d "${abi_path}" ]; then
    echo ""
    echo e "${GREEN}-- Analyzing ABI: ${abi} ---${ENDCOLOR}"
    abi_matches="$(find "${abi_path}" -type f -name "*.so")"
    if [ -z "$abi_matches" ]; then
      echo "No .so files found for ${abi}."
    fi
    IFS=$'\n'
    for match in $abi_matches; do
      file_output=$(file -b "${match}" 2>/dev/null)
      [[ "${file_output}" == "ELF" ]] || continue
 
      res_raw=$(objdump -p "${match}" 2>/dev/null | awk '/LOAD/ { for (i=1; i<=NF; i++) { if ($i == "align" && (i+1) <= NF) { print $(i+1); break; } } }' | head -1)
 
      alignment_value_bytes=""
      if [[ $res_raw =~ 2\*\*([0-9]+) ]]; then
        exponent=${BASH_REMATCH[1]}
        alignment_value_bytes=$((2**exponent))
      fi
 
      STATUS_TEXT=""
      if [[ "$alignment_value_bytes" == "16384" || "$alignment_value_bytes" == "65536" ]]; then
        STATUS_TEXT="${GREEN}ALIGNED${ENDCOLOR}"
      else
        STATUS_TEXT="${RED}UNALIGNED${ENDCOLOR}"
        unaligned_libs+=("${match}")
      fi
 
      printf "%-100s %-20b %s\n" "${match}" "${STATUS_TEXT}" "${alignment_value_bytes} ($res_raw)"
    done
    printf "%-100s %-20s %s\n" "----------------------------------------------------------------------------------------------------" "--------------------" "-----------------------"
  fi
done
 
echo ""
if [ ${#unaligned_libs[@]} -gt 0 ]; then
  echo -e "${RED}Found ${#unaligned_libs[@]} unaligned libs (only arm64-v8a/x86_64 libs need alignment).${ENDCOLOR}"
  exit 1
else
  echo -e "${GREEN}ELF Verification Successful${ENDCOLOR}"
fi
echo "==========================="