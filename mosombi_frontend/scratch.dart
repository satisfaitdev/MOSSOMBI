void main() {
  List<String> colors = ["#F44336", "#2196F3", "#4CAF50", "#000000", "#FFFFFF", "#9E9E9E", "#3F51B5"];
  for (var c in colors) {
    try {
      String hexStr = c.replaceAll('#', '');
      if (hexStr.length == 6) hexStr = 'FF$hexStr';
      int cVal = int.parse(hexStr, radix: 16);
      print("Success for $c: $cVal");
    } catch (e) {
      print("Error for $c: $e");
    }
  }
}
